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

  const questionTypesDesc = params.questionTypes
    .map((q) => `- ${q.type}: Generate ${q.count} questions, each worth ${q.marks} marks.`)
    .join('\n');

  // ==========================================
  // AGENT 1: CREATOR AGENT
  // ==========================================
  if (onProgress) {
    onProgress('Creator Agent: Designing assessment blueprint and drafting questions...', 45);
  }

  const creatorSystemPrompt = `You are a Creator Agent in a multi-agent system.
Your job is to draft a professional, curriculum-compliant exam question paper based on specifications.
Output a single, valid JSON object containing "sections", "subject", "className", and "timeAllowed".
Do not output any other text, markdown blocks, or explanations.

CRITICAL GUARDRAIL:
If the user's provided topic/title is a single letter (like "a", "x"), a random meaningless letter sequence (like "asdf", "abc"), or contains insufficient/meaningless information to generate a valid curriculum exam paper, you MUST NOT generate dummy questions. Instead, output a JSON object containing a single key "error" explaining that the topic has insufficient or meaningless details (e.g. {"error": "The topic provided contains insufficient or meaningless information. Please specify a proper topic or provide a reference document."}). Do not default to a random subject like mathematics.

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
      "studentInstruction": "Ask the student to draw the required diagram or graph and explain the relevant theory or calculations in their answer. Provide clear guidance in the question text without supplying any image or SVG."
        }
      ]
    }
  ]
}

Guidelines:
1. Strictly respect the requested question types, counts, and marks.
2. Adjust the cognitive complexity, mathematical rigor, vocabulary, and depth to be appropriate for the requested target grade level.
3. Distribute difficulty levels relative to that grade: 'Easy', 'Moderate', and 'Challenging'.
4. If reference material is provided, create questions directly testing that content.
5. CRITICAL: Do NOT generate any questions that rely on images, graphs, or visual diagrams being shown to the student (e.g., never generate questions starting with "Identify the graph shown below"). This platform only supports text.`;

  const creatorUserPrompt = `Draft an assessment for:
Topic: "${params.title}"
Subject Context: "${params.subject || 'Science'}"
Target Grade/Class Level: "${params.className || 'Grade 8'}"
Overall Paper Difficulty: "${params.difficulty || 'Mixed'}"
Question Types Required:
${questionTypesDesc}

${params.additionalInstructions ? `Additional Guidelines: "${params.additionalInstructions}"` : ''}

${params.referenceText ? `---
Reference Material:
${params.referenceText}
---` : ''}`;

  let draftPaper;
  
  if (params.existingPaper) {
    // ==========================================
    // AGENT 1A: REFINER AGENT (Modifying Existing Paper)
    // ==========================================
    if (onProgress) {
      onProgress('Refiner Agent: Analyzing existing paper and applying requested changes...', 30);
    }
    const refinerSystemPrompt = `You are a Refiner Agent in an educational assessment platform.
The user has an existing question paper and has requested specific revisions (e.g., "replace Q3", "make questions harder").
You must apply their feedback to the existing questions, modifying ONLY what is necessary to satisfy the request.
Output a JSON object with this exact structure:
{
  "subject": "String",
  "className": "String",
  "timeAllowed": "String",
  "sections": [
    {
      "title": "String",
      "instruction": "String",
      "questions": [
        {
          "questionText": "String",
          "difficulty": "Easy | Moderate | Challenging",
          "marks": Number,
          "svgDiagram": "String or null"
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": Number,
      "answerText": "String"
    }
  ]
}
Maintain the JSON schema perfectly. Preserve any questions that the user did not ask to change.
CRITICAL INSTRUCTION: If the user asks to remove or delete a specific question, you MUST ONLY remove that single question from the "questions" array. Do NOT delete the entire section. 
CRITICAL INSTRUCTION: If you replace or modify a question, you MUST accurately rewrite the corresponding answer inside the "answerKey" array to match the new question. Do not leave the old answer.`;

    const refinerUserPrompt = `
Existing Paper Sections JSON:
${JSON.stringify(params.existingPaper.sections, null, 2)}

Existing Answer Key JSON:
${JSON.stringify(params.existingPaper.answerKey, null, 2)}

User Feedback / Additional Instructions:
${params.additionalInstructions || 'No feedback provided. Keep paper as is.'}

Overall Target Difficulty: "${params.difficulty || 'Mixed'}"
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
      console.log('Refiner Agent output successfully parsed.');
      
      // Early return to skip Creator/Reviewer/Solver if we're just refining!
      return draftPaper;
    } catch (error: any) {
      console.error('Refiner Agent failed:', error);
      throw new Error(error.message || 'Refiner Agent failed to refine the assessment.');
    }
  } else {
    // ==========================================
    // AGENT 1B: CREATOR AGENT (Drafting)
    // ==========================================
    if (onProgress) {
      onProgress('Creator Agent: Structuring syllabus, analyzing content, and drafting paper...', 30);
    }

    try {
      const creatorResponse = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: creatorSystemPrompt },
          { role: 'user', content: creatorUserPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const draftText = creatorResponse.choices[0]?.message?.content || '';
      draftPaper = JSON.parse(draftText.trim());
      
      if (draftPaper.error) {
        throw new Error(draftPaper.error);
      }
      
      console.log('Creator Agent output successfully parsed.');
    } catch (error: any) {
      console.error('Creator Agent failed:', error);
      throw new Error(error.message || 'Creator Agent failed to formulate the assessment.');
    }
  }

  // ==========================================
  // AGENT 2: REVIEWER AGENT (Critic / Guardrail)
  // ==========================================
  if (onProgress) {
    onProgress('Reviewer Agent: Validating counts, marks, difficulty, and factual accuracy...', 65);
  }

  const reviewerSystemPrompt = `You are a Reviewer Agent in a multi-agent system.
Your job is to review the drafted exam paper generated by the Creator Agent, verify counts/marks, and make necessary edits to ensure perfect quality.
You must output a single, valid JSON object matching the exact input structure, containing the corrected/improved "sections", "subject", "className", and "timeAllowed".
Do not output any other text or explanation.

Your assessment criteria:
1. Verify question count: Does it match the user requirement?
2. Verify marks: Does each question match the specified mark?
3. Grammar and Factual Correctness: Fix any ambiguous or factual errors.
4. If correct, return it unchanged. If incorrect, correct it and return the corrected JSON.`;

  const reviewerUserPrompt = `User Requirements:
${questionTypesDesc}

Draft Paper under Review:
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
    console.log('Reviewer Agent evaluation complete.');
  } catch (error) {
    console.warn('Reviewer Agent failed, falling back to draft:', error);
    reviewedPaper = draftPaper;
  }

  // ==========================================
  // AGENT 3: SOLVER AGENT (Answer Key Generator)
  // ==========================================
  if (onProgress) {
    onProgress('Solver Agent: Solving assessment questions and generating answer keys...', 80);
  }

  const solverSystemPrompt = `You are a Solver Agent in a multi-agent system.
Your job is to solve the finalized assessment paper questions chronologically and return a comprehensive Answer Key.
Output a single, valid JSON object containing an "answerKey" array.
Do not output any other text or explanation.

Output JSON schema:
{
  "answerKey": [
    {
      "questionNumber": number,
      "answerText": "Detailed explanation and final correct answer."
    }
  ]
}

Ensure the answers are complete, clear, and direct.`;

  // Flatten questions to pass to the solver
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
    console.log('Solver Agent output successfully parsed.');
  } catch (error) {
    console.error('Solver Agent failed:', error);
    // Build a mock/empty answer key to avoid crash
    solvedKey = {
      answerKey: questionsToSolve.map((q) => ({
        questionNumber: q.number,
        answerText: 'Solution key generation failed. Please consult reference guides.',
      })),
    };
  }

  // Combine Reviewed Paper with Answer Key
  return {
    ...reviewedPaper,
    answerKey: solvedKey.answerKey,
  };
};
