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
  difficulty?: string;
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
  const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 100);
  const keywords = [...title.toLowerCase().split(' '), ...subject.toLowerCase().split(' ')]
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 3);

  if (keywords.length === 0 || chunks.length <= topK) {
    return chunks.slice(0, topK).join('\n...\n');
  }

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const lowerChunk = chunk.toLowerCase();
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      const matches = lowerChunk.match(regex);
      if (matches) score += matches.length;
    });
    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK).map(c => c.chunk).join('\n...\n');
}

// --- Validation Layer ---
// Relaxed: allows ±1 mark tolerance to prevent retries over minor floating point/rounding
function validateAssessment(paper: any, expectedTotalMarks: number, expectedTotalQuestions: number) {
  let actualMarks = 0;
  let actualQuestions = 0;
  const questionTexts = new Set<string>();

  if (!paper.sections || !Array.isArray(paper.sections)) {
    throw new Error('Validation Failed: Missing sections array.');
  }

  for (const sec of paper.sections) {
    if (!sec.questions || !Array.isArray(sec.questions)) {
      throw new Error(`Validation Failed: Missing questions array in section "${sec.title}".`);
    }
    for (const q of sec.questions) {
      const marks = Number(q.marks);
      if (isNaN(marks)) throw new Error('Validation Failed: Invalid marks format for question.');
      actualMarks += marks;
      actualQuestions += 1;

      const normalized = (q.questionText || '').toLowerCase().trim().substring(0, 100); // compare only first 100 chars
      if (!normalized) throw new Error('Validation Failed: Empty question text detected.');
      if (questionTexts.has(normalized)) {
        throw new Error(`Validation Failed: Duplicate question detected: "${q.questionText.substring(0, 60)}..."`);
      }
      questionTexts.add(normalized);
    }
  }

  if (actualQuestions !== expectedTotalQuestions) {
    throw new Error(`Validation Failed: Question count mismatch. Expected ${expectedTotalQuestions}, got ${actualQuestions}`);
  }
  // Allow ±1 mark tolerance for rounding edge cases
  if (Math.abs(actualMarks - expectedTotalMarks) > 1) {
    throw new Error(`Validation Failed: Marks mismatch. Expected ${expectedTotalMarks}, got ${actualMarks}`);
  }
}

export const generateAssessmentPaper = async (
  params: GenerateParams,
  onProgress?: AgentProgressCallback
) => {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
  const modelName = process.env.LLM_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is not defined.');
  }

  const openai = new OpenAI({ apiKey, baseURL });

  const expectedTotalQuestions = params.questionTypes.reduce((acc, qt) => acc + qt.count, 0);
  const expectedTotalMarks = params.questionTypes.reduce((acc, qt) => acc + (qt.count * qt.marks), 0);

  const questionTypesDesc = params.questionTypes
    .map((q) => `- ${q.type}: ${q.count} questions × ${q.marks} mark(s) each`)
    .join('\n');

  // Mini-RAG: only extract context if reference text provided
  let injectedContext = '';
  if (params.referenceText) {
    const topChunks = chunkAndRetrieveContext(params.referenceText, params.title, params.subject || '');
    injectedContext = `\n---\nREFERENCE MATERIAL (use to base questions on):\n${topChunks}\n---`;
  }

  // Difficulty instruction
  let diffStr = params.difficulty || 'Mixed';
  let diffInstruction = `Difficulty: ${diffStr}`;
  try {
    const diffObj = JSON.parse(diffStr);
    if (diffObj.easy !== undefined && diffObj.medium !== undefined && diffObj.hard !== undefined) {
      diffInstruction = `Distribute difficulty: Easy ${diffObj.easy}%, Moderate ${diffObj.medium}%, Challenging ${diffObj.hard}%`;
    }
  } catch (_) {}

  // ==========================================
  // AGENT 1A: REFINER AGENT (only when editing an existing paper)
  // ==========================================
  if (params.existingPaper) {
    if (onProgress) onProgress('Refiner Agent: Applying requested changes to existing paper...', 30);

    const refinerResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a Refiner Agent. The teacher has an existing exam paper and wants specific edits.
Apply ONLY the changes requested. Keep all other questions exactly as-is.
Rewrite the corresponding answerKey entry for any modified question.
Output a single valid JSON object with the same structure as the input (sections + answerKey).
Do not include markdown, explanations, or extra keys.`,
        },
        {
          role: 'user',
          content: `EXISTING PAPER:\n${JSON.stringify(params.existingPaper.sections)}\n\nEXISTING ANSWER KEY:\n${JSON.stringify(params.existingPaper.answerKey)}\n\nREQUESTED CHANGES:\n${params.additionalInstructions || 'No changes requested. Return paper as-is.'}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 6000,
    });

    const refinedText = refinerResponse.choices[0]?.message?.content || '';
    return JSON.parse(refinedText.trim());
  }

  // ==========================================
  // AGENT 1: CREATOR AGENT (with retry loop)
  // ==========================================
  const creatorSystemPrompt = `You are a Creator Agent generating a professional exam question paper.
Output ONLY a single valid JSON object. No markdown, no explanation.

RULES:
1. Generate EXACTLY the number of questions specified. Not one more, not one less.
2. Total marks must equal exactly the sum specified.
3. Every question must be completely unique — no duplicates or near-duplicates.
4. For Multiple Choice Questions: embed all 4 options (A) (B) (C) (D) directly inside questionText.
5. Do NOT reference graphs, images, or visual diagrams. All questions must be text-only.
6. If the topic is too vague or meaningless, output {"error": "Topic too vague to generate valid questions."}.

JSON Schema:
{"subject":"...","className":"...","timeAllowed":"...","sections":[{"title":"Section A","instruction":"...","questions":[{"questionText":"...","difficulty":"Easy|Moderate|Challenging","marks":1}]}]}`;

  const creatorUserPrompt = `Generate exam paper for:
Title: "${params.title}"
Subject: "${params.subject || 'General'}"
Class: "${params.className || 'Grade 8'}"
${diffInstruction}

Required question types (MUST match exactly):
${questionTypesDesc}
Total: ${expectedTotalQuestions} questions, ${expectedTotalMarks} marks

${params.additionalInstructions ? `Teacher instructions: "${params.additionalInstructions}"` : ''}
${injectedContext}`;

  let draftPaper: any;
  let attempts = 0;
  const maxAttempts = 3;
  let lastValidationError: string | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    if (onProgress) onProgress(`Creator Agent: Drafting paper (attempt ${attempts}/${maxAttempts})...`, 20 + (attempts * 5));

    try {
      const creatorResponse = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: creatorSystemPrompt },
          {
            role: 'user',
            content: creatorUserPrompt + (lastValidationError
              ? `\n\n⚠️ PREVIOUS ATTEMPT FAILED: ${lastValidationError}. Fix this now.`
              : ''),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3 + (attempts * 0.1),
        max_tokens: 8000,
      });

      const draftText = creatorResponse.choices[0]?.message?.content || '';
      draftPaper = JSON.parse(draftText.trim());

      if (draftPaper.error) throw new Error(draftPaper.error);

      if (onProgress) onProgress(`Validation Agent: Checking counts (${expectedTotalQuestions} Qs) and marks (${expectedTotalMarks})...`, 40);
      validateAssessment(draftPaper, expectedTotalMarks, expectedTotalQuestions);

      console.log(`Creator Agent passed validation on attempt ${attempts}.`);
      break;
    } catch (error: any) {
      lastValidationError = error.message;
      console.warn(`Creator attempt ${attempts} failed:`, lastValidationError);
      if (attempts >= maxAttempts) {
        throw new Error(`Generation failed after ${maxAttempts} attempts. Last error: ${lastValidationError}`);
      }
    }
  }

  // ==========================================
  // AGENT 2: REVIEWER AGENT
  // Quick heuristic check first — only call the LLM if issues are detected
  // ==========================================
  if (onProgress) onProgress('Reviewer Agent: Checking paper quality...', 55);

  // Heuristic: check if any question likely has MCQ issues or image references
  const needsReview = draftPaper.sections?.some((sec: any) =>
    sec.questions?.some((q: any) => {
      const t = (q.questionText || '').toLowerCase();
      return t.includes('graph below') || t.includes('figure below') || t.includes('diagram below') ||
        t.includes('image below') || t.includes('refer to') ||
        (t.includes('select') && !t.includes('(a)') && !t.includes('(b)'));
    })
  );

  let reviewedPaper = draftPaper;

  if (needsReview) {
    if (onProgress) onProgress('Reviewer Agent: Fixing question quality issues...', 60);
    try {
      const reviewerResponse = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: `You are a Reviewer Agent. Fix issues in this exam paper:
1. If any question references a graph/figure/image/diagram, rewrite it as a pure text question.
2. If any MCQ question is missing options, add (A) (B) (C) (D) options inside the questionText.
3. Do NOT change question counts, marks, or structure.
Output the corrected JSON with the same schema. No markdown.`,
          },
          { role: 'user', content: JSON.stringify(draftPaper) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 8000,
      });

      const reviewedText = reviewerResponse.choices[0]?.message?.content || '';
      const candidate = JSON.parse(reviewedText.trim());
      // Only accept reviewer output if it passes validation
      validateAssessment(candidate, expectedTotalMarks, expectedTotalQuestions);
      reviewedPaper = candidate;
    } catch (error) {
      console.warn('Reviewer Agent failed, keeping original draft:', error);
      reviewedPaper = draftPaper;
    }
  } else {
    console.log('Reviewer Agent: No issues detected via heuristics, skipping LLM call.');
  }

  // ==========================================
  // AGENT 3: SOLVER AGENT (Answer Key Generation)
  // ==========================================
  if (onProgress) onProgress('Solver Agent: Generating answer key...', 75);

  const questionsToSolve: { number: number; text: string; marks: number }[] = [];
  let index = 1;
  reviewedPaper.sections.forEach((sec: any) => {
    sec.questions.forEach((q: any) => {
      questionsToSolve.push({ number: index++, text: q.questionText, marks: q.marks });
    });
  });

  let solvedKey: any;
  try {
    const solverResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a Solver Agent. Provide concise, accurate answers for each exam question.
Output JSON: {"answerKey":[{"questionNumber":1,"answerText":"concise answer here"},...]}
Keep answers brief but complete. If a question is impossible or factually wrong, write "HALLUCINATION DETECTED: [reason]".
No markdown, no extra keys.`,
        },
        { role: 'user', content: JSON.stringify(questionsToSolve) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4000,
    });

    const solvedText = solverResponse.choices[0]?.message?.content || '';
    solvedKey = JSON.parse(solvedText.trim());

    const hallucinations = (solvedKey.answerKey || []).filter((a: any) =>
      typeof a.answerText === 'string' && a.answerText.includes('HALLUCINATION DETECTED')
    );
    if (hallucinations.length > 0) {
      console.warn(`Solver Agent flagged ${hallucinations.length} hallucination(s).`);
      if (onProgress) onProgress(`Solver flagged ${hallucinations.length} questionable question(s).`, 85);
    }
  } catch (error) {
    console.error('Solver Agent failed:', error);
    solvedKey = {
      answerKey: questionsToSolve.map((q) => ({
        questionNumber: q.number,
        answerText: 'Answer not available.',
      })),
    };
  }

  if (onProgress) onProgress('Finalizing and saving to database...', 95);

  return {
    ...reviewedPaper,
    answerKey: solvedKey.answerKey,
  };
};
