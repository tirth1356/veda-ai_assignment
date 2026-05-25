import OpenAI from 'openai';

interface QuestionInput {
  type: string;
  count: number;
  marks: number;
}

interface GenerateParams {
  title: string;
  className?: string;
  subject?: string;
  difficulty?: string; // Now typically a JSON string like {"easy":30,"medium":50,"hard":20}
  questionTypes: QuestionInput[];
  additionalInstructions?: string;
  referenceText?: string;
  existingPaper?: any;
}

// Progress status callback for reporting agent steps
type AgentProgressCallback = (message: string, progress: number) => void;

// --- Mini-RAG: Context Chunking & Retrieval ---
function chunkAndRetrieveContext(text: string, title: string, subject: string, topK: number = 3): string {
  if (!text) return '';
  
  // Split text into paragraphs/chunks
  const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 100);
  
  // Extract search keywords from title and subject
  const keywords = [...title.toLowerCase().split(' '), ...subject.toLowerCase().split(' ')]
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 3);
  
  if (keywords.length === 0 || chunks.length <= topK) {
    return chunks.slice(0, topK).join('\n...\n');
  }

  // Score chunks based on keyword frequency
  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const lowerChunk = chunk.toLowerCase();
    keywords.forEach(kw => {
      // Basic term frequency
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      const matches = lowerChunk.match(regex);
      if (matches) score += matches.length;
    });
    return { chunk, score };
  });
  
  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);
  
  // Return the top K most relevant chunks
  return scoredChunks.slice(0, topK).map(c => c.chunk).join('\n...\n');
}

// --- Validation Layer ---
function validateAssessment(paper: any, expectedTotalMarks: number, expectedTotalQuestions: number) {
  let actualMarks = 0;
  let actualQuestions = 0;
  const questionTexts = new Set();
  
  if (!paper.sections || !Array.isArray(paper.sections)) throw new Error("Validation Failed: Missing sections array.");
  
  for (const sec of paper.sections) {
    if (!sec.questions || !Array.isArray(sec.questions)) throw new Error(`Validation Failed: Missing questions array in section ${sec.title}.`);
    for (const q of sec.questions) {
      if (typeof q.marks !== 'number') throw new Error(`Validation Failed: Invalid marks format for question.`);
      actualMarks += q.marks;
      actualQuestions += 1;
      
      const normalized = (q.questionText || '').toLowerCase().trim();
      if (!normalized) throw new Error("Validation Failed: Empty question text detected.");
      if (questionTexts.has(normalized)) {
        throw new Error(`Validation Failed: Duplicate question detected: "${q.questionText}"`);
      }
      questionTexts.add(normalized);
    }
  }
  
  if (actualQuestions !== expectedTotalQuestions) {
    throw new Error(`Validation Failed: Question count mismatch. Expected ${expectedTotalQuestions}, got ${actualQuestions}`);
  }
  if (actualMarks !== expectedTotalMarks) {
    throw new Error(`Validation Failed: Marks mismatch. Expected ${expectedTotalMarks}, got ${actualMarks}`);
  }
}

export const generateAssessmentPaper = async (
  params: GenerateParams,
  onProgress?: AgentProgressCallback
) => {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1'; // Default to Groq
  const modelName = process.env.LLM_MODEL || 'llama-3.1-8b-instant'; // Default to Llama-3.1-8b-instant

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is not defined.');
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  const expectedTotalQuestions = params.questionTypes.reduce((acc, qt) => acc + qt.count, 0);
  const expectedTotalMarks = params.questionTypes.reduce((acc, qt) => acc + (qt.count * qt.marks), 0);

  const questionTypesDesc = params.questionTypes
    .map((q) => `- ${q.type}: Generate ${q.count} questions, each worth ${q.marks} marks.`)
    .join('\n');

  // Process Mini-RAG if reference text is provided
  let injectedContext = '';
  if (params.referenceText) {
    if (onProgress) onProgress('RAG Agent: Chunking and retrieving highly relevant context...', 10);
    const topChunks = chunkAndRetrieveContext(params.referenceText, params.title, params.subject || '');
    injectedContext = `\n---\nRelevant Context Material (Extracted via RAG):\n${topChunks}\n---`;
  }

  // Parse Difficulty Distribution
  let diffStr = params.difficulty || 'Mixed';
  let diffInstruction = `Overall Paper Difficulty: "${diffStr}"`;
  try {
    const diffObj = JSON.parse(diffStr);
    if (diffObj.easy !== undefined && diffObj.medium !== undefined && diffObj.hard !== undefined) {
      diffInstruction = `DIFFICULTY BLUEPRINT ENFORCEMENT:\nYou MUST distribute the questions exactly as follows:\n- Easy: ${diffObj.easy}%\n- Medium: ${diffObj.medium}%\n- Challenging: ${diffObj.hard}%`;
    }
  } catch(e) {} // If it's just a plain string 'Mixed', ignore parse error

  // ==========================================
  // AGENT 1: CREATOR AGENT
  // ==========================================
  
  const creatorSystemPrompt = `You are a Creator Agent in a multi-agent system.
Your job is to draft a professional, curriculum-compliant exam question paper based on specifications.
Output a single, valid JSON object containing "sections", "subject", "className", and "timeAllowed".
Do not output any other text, markdown blocks, or explanations.

CRITICAL GUARDRAIL:
If the user's provided topic/title contains insufficient/meaningless information to generate a valid curriculum exam paper, you MUST NOT generate dummy questions. Instead, output a JSON object containing a single key "error" explaining that the topic has insufficient details.

Output JSON schema:
{
  "subject": "Subject Name",
  "className": "Class Level",
  "timeAllowed": "Estimated duration",
  "sections": [
    {
      "title": "Section A (or B, etc.)",
      "instruction": "Instructions for this section",
      "questions": [
        {
          "questionText": "Clear and specific question",
          "difficulty": "Easy" | "Moderate" | "Challenging",
          "marks": number,
          "studentInstruction": "Optional instructions for the student. Do NOT ask the student to look at or reference any provided graphs, figures, or images."
        }
      ]
    }
  ]
}

Guidelines:
1. Strictly respect the requested question types, counts, and marks. The total counts MUST perfectly match the prompt requirements.
2. If reference material is provided, create questions directly testing that content.
3. CRITICAL: Do NOT generate any questions that rely on images, graphs, figures, or visual diagrams being shown to the student. Assume the student only has plain text.`;

  const creatorUserPrompt = `Draft an assessment for:
Topic: "${params.title}"
Subject Context: "${params.subject || 'Science'}"
Target Grade/Class Level: "${params.className || 'Grade 8'}"

${diffInstruction}

Question Types Required (MUST MATCH EXACTLY):
${questionTypesDesc}

${params.additionalInstructions ? `Additional Guidelines: "${params.additionalInstructions}"` : ''}

${injectedContext}`;

  let draftPaper;
  
  if (params.existingPaper) {
    // ==========================================
    // AGENT 1A: REFINER AGENT (Modifying Existing Paper)
    // ==========================================
    if (onProgress) onProgress('Refiner Agent: Analyzing existing paper and applying requested changes...', 30);
    
    const refinerSystemPrompt = `You are a Refiner Agent in an educational assessment platform.
The user has an existing question paper and has requested specific revisions (e.g., "replace Q3", "make questions harder").
You must apply their feedback to the existing questions, modifying ONLY what is necessary to satisfy the request.
Output a JSON object with the exact same structure as the input, preserving untouched questions.
CRITICAL: If you replace or modify a question, rewrite the corresponding answer inside the "answerKey" array to match.`;

    const refinerUserPrompt = `
Existing Paper Sections JSON:
${JSON.stringify(params.existingPaper.sections, null, 2)}

Existing Answer Key JSON:
${JSON.stringify(params.existingPaper.answerKey, null, 2)}

User Feedback / Additional Instructions:
${params.additionalInstructions || 'No feedback provided. Keep paper as is.'}
`;

    try {
      const refinerResponse = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: refinerSystemPrompt },
          { role: 'user', content: refinerUserPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const refinedText = refinerResponse.choices[0]?.message?.content || '';
      draftPaper = JSON.parse(refinedText.trim());
      return draftPaper; // Skip generation pipeline for pure refinement
    } catch (error: any) {
      throw new Error(error.message || 'Refiner Agent failed to refine the assessment.');
    }
  } else {
    // ==========================================
    // CREATION & VALIDATION LOOP
    // ==========================================
    let attempts = 0;
    const maxAttempts = 3;
    let lastValidationError = null;

    while (attempts < maxAttempts) {
      attempts++;
      if (onProgress) onProgress(`Creator Agent: Drafting paper (Attempt ${attempts}/${maxAttempts})...`, 20 + (attempts * 5));

      try {
        const creatorResponse = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: creatorSystemPrompt },
            { role: 'user', content: creatorUserPrompt + (lastValidationError ? `\n\nPREVIOUS GENERATION FAILED VALIDATION: ${lastValidationError}. Fix this immediately.` : '') },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4 + (attempts * 0.1), // Slightly increase temp on retries to unstick
        });

        const draftText = creatorResponse.choices[0]?.message?.content || '';
        draftPaper = JSON.parse(draftText.trim());
        
        if (draftPaper.error) {
          throw new Error(draftPaper.error);
        }
        
        // --- Output Validation Layer ---
        if (onProgress) onProgress(`Validation Agent: Verifying schema, marks (${expectedTotalMarks}), and counts (${expectedTotalQuestions})...`, 40);
        validateAssessment(draftPaper, expectedTotalMarks, expectedTotalQuestions);
        
        // If it passes validation, break the loop
        console.log(`Creator Agent output passed validation on attempt ${attempts}.`);
        break;
      } catch (error: any) {
        lastValidationError = error.message;
        console.warn(`Creator validation failed on attempt ${attempts}:`, lastValidationError);
        if (attempts >= maxAttempts) {
          throw new Error(`AI generation repeatedly failed strict schema validation. Last Error: ${lastValidationError}`);
        }
      }
    }
  }

  // ==========================================
  // AGENT 2: REVIEWER AGENT (Critic / Guardrail)
  // ==========================================
  if (onProgress) onProgress('Reviewer Agent: Enhancing vocabulary and factual accuracy...', 55);

  const reviewerSystemPrompt = `You are a Reviewer Agent.
Review the drafted exam paper generated by the Creator Agent.
1. Fix any ambiguous phrasing, grammatical errors, or factual inaccuracies.
2. ABSOLUTE CRITICAL CHECK: Read every single question. If ANY question references a missing graph, figure, image, or visual diagram (e.g., "in the graph below"), you MUST rewrite the question to be a pure text-based problem.
3. Output a single, valid JSON object matching the exact input structure. Do NOT change question counts or marks.`;

  const reviewerUserPrompt = `Draft Paper under Review:
${JSON.stringify(draftPaper, null, 2)}`;

  let reviewedPaper;
  try {
    const reviewerResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: reviewerSystemPrompt },
        { role: 'user', content: reviewerUserPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const reviewedText = reviewerResponse.choices[0]?.message?.content || '';
    reviewedPaper = JSON.parse(reviewedText.trim());
    
    // Quick safety check: if Reviewer messed up the structure, fallback to draft
    validateAssessment(reviewedPaper, expectedTotalMarks, expectedTotalQuestions);
  } catch (error) {
    console.warn('Reviewer Agent failed or broke schema, falling back to original draft:', error);
    reviewedPaper = draftPaper;
  }

  // ==========================================
  // AGENT 3: SOLVER AGENT (Hallucination Detection)
  // ==========================================
  if (onProgress) onProgress('Solver Agent: Solving questions and detecting hallucinations...', 75);

  const solverSystemPrompt = `You are a Solver Agent.
Your job is to solve the finalized assessment paper questions.
If a question is impossible to solve, lacks necessary context, or is factually paradoxical, you must flag it as a hallucination.
Output a JSON object containing an "answerKey" array.

Schema:
{
  "answerKey": [
    {
      "questionNumber": number,
      "answerText": "Detailed explanation and final correct answer. If hallucinatory, state 'HALLUCINATION DETECTED: [Reason]'"
    }
  ]
}`;

  const questionsToSolve: { number: number; text: string; marks: number }[] = [];
  let index = 1;
  reviewedPaper.sections.forEach((sec: any) => {
    sec.questions.forEach((q: any) => {
      questionsToSolve.push({
        number: index++,
        text: q.questionText,
        marks: q.marks,
      });
    });
  });

  const solverUserPrompt = `Questions to solve:
${JSON.stringify(questionsToSolve, null, 2)}`;

  let solvedKey;
  try {
    const solverResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: solverSystemPrompt },
        { role: 'user', content: solverUserPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const solvedText = solverResponse.choices[0]?.message?.content || '';
    solvedKey = JSON.parse(solvedText.trim());
    
    // Log hallucinations if detected
    const hallucinations = solvedKey.answerKey.filter((a: any) => a.answerText.includes('HALLUCINATION DETECTED'));
    if (hallucinations.length > 0) {
      console.warn('Solver Agent detected hallucinations:', hallucinations);
      // In a production system, we would route this back to the Reviewer. For now, we log it and keep the flag in the answer key.
      if (onProgress) onProgress(`Solver Agent flagged ${hallucinations.length} questions as potential hallucinations.`, 85);
    }

  } catch (error) {
    console.error('Solver Agent failed:', error);
    solvedKey = {
      answerKey: questionsToSolve.map((q) => ({
        questionNumber: q.number,
        answerText: 'Solution key generation failed.',
      })),
    };
  }

  if (onProgress) onProgress('Finalizing payload and saving to database...', 95);

  return {
    ...reviewedPaper,
    answerKey: solvedKey.answerKey,
  };
};
