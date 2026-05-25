/**
 * Assignment Data Validation
 * Ensures data integrity before PDF generation
 */

export interface Question {
  questionText: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  questionNumber?: number;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface AnswerKeyItem {
  questionNumber: number;
  answerText: string;
}

export interface IAssignment {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  totalMarks: number;
  sections: Section[];
  answerKey?: AnswerKeyItem[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validates assignment data
 * @param assignment Assignment object to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateAssignment = (assignment: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!assignment || typeof assignment !== 'object') {
    return [{ field: 'assignment', message: 'Assignment must be a valid object' }];
  }

  if (!assignment.schoolName || typeof assignment.schoolName !== 'string') {
    errors.push({
      field: 'schoolName',
      message: 'School name is required and must be a string',
      value: assignment.schoolName,
    });
  }

  if (!assignment.subject || typeof assignment.subject !== 'string') {
    errors.push({
      field: 'subject',
      message: 'Subject is required and must be a string',
      value: assignment.subject,
    });
  }

  if (!assignment.className || typeof assignment.className !== 'string') {
    errors.push({
      field: 'className',
      message: 'Class name is required and must be a string',
      value: assignment.className,
    });
  }

  if (!assignment.timeAllowed || typeof assignment.timeAllowed !== 'string') {
    errors.push({
      field: 'timeAllowed',
      message: 'Time allowed is required and must be a string',
      value: assignment.timeAllowed,
    });
  }

  if (typeof assignment.totalMarks !== 'number' || assignment.totalMarks < 0) {
    errors.push({
      field: 'totalMarks',
      message: 'Total marks must be a non-negative number',
      value: assignment.totalMarks,
    });
  }

  // Validate sections
  if (!Array.isArray(assignment.sections) || assignment.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'At least one section is required',
      value: assignment.sections,
    });
  } else {
    if (assignment.sections.length > 26) {
      errors.push({
        field: 'sections',
        message: 'Maximum 26 sections allowed (A-Z)',
        value: assignment.sections.length,
      });
    }

    let totalQuestions = 0;
    let totalSectionMarks = 0;

    assignment.sections.forEach((section: any, sIndex: number) => {
      // Validate section structure
      if (!section.title || typeof section.title !== 'string') {
        errors.push({
          field: `sections[${sIndex}].title`,
          message: 'Section title is required and must be a string',
        });
      }

      if (!section.instruction || typeof section.instruction !== 'string') {
        errors.push({
          field: `sections[${sIndex}].instruction`,
          message: 'Section instruction is required and must be a string',
        });
      }

      if (!Array.isArray(section.questions) || section.questions.length === 0) {
        errors.push({
          field: `sections[${sIndex}].questions`,
          message: 'Each section must have at least one question',
        });
      } else {
        if (section.questions.length > 100) {
          errors.push({
            field: `sections[${sIndex}].questions`,
            message: 'Maximum 100 questions per section',
            value: section.questions.length,
          });
        }

        // Validate each question
        section.questions.forEach((q: any, qIndex: number) => {
          if (!q.questionText || typeof q.questionText !== 'string') {
            errors.push({
              field: `sections[${sIndex}].questions[${qIndex}].questionText`,
              message: 'Question text is required and must be a string',
            });
          }

          if (!['Easy', 'Moderate', 'Challenging'].includes(q.difficulty)) {
            errors.push({
              field: `sections[${sIndex}].questions[${qIndex}].difficulty`,
              message: 'Difficulty must be Easy, Moderate, or Challenging',
              value: q.difficulty,
            });
          }

          if (typeof q.marks !== 'number' || q.marks < 0.5 || q.marks > 100) {
            errors.push({
              field: `sections[${sIndex}].questions[${qIndex}].marks`,
              message: 'Marks must be a number between 0.5 and 100',
              value: q.marks,
            });
          }

          totalQuestions++;
          totalSectionMarks += q.marks || 0;
        });
      }
    });

    // Check total questions limit
    if (totalQuestions > 500) {
      errors.push({
        field: 'sections',
        message: 'Total questions across all sections cannot exceed 500',
        value: totalQuestions,
      });
    }

    // Warn if section marks don't match total marks
    if (Math.abs(totalSectionMarks - assignment.totalMarks) > 0.01) {
      console.warn(
        `Warning: Total marks from questions (${totalSectionMarks}) does not match assignment total marks (${assignment.totalMarks})`
      );
    }
  }

  // Validate answer key if provided
  if (assignment.answerKey && Array.isArray(assignment.answerKey)) {
    assignment.answerKey.forEach((ans: any, aIndex: number) => {
      if (typeof ans.questionNumber !== 'number' || ans.questionNumber < 1) {
        errors.push({
          field: `answerKey[${aIndex}].questionNumber`,
          message: 'Question number must be a positive integer',
          value: ans.questionNumber,
        });
      }

      if (!ans.answerText || typeof ans.answerText !== 'string') {
        errors.push({
          field: `answerKey[${aIndex}].answerText`,
          message: 'Answer text is required and must be a string',
        });
      }
    });
  }

  return errors;
};

/**
 * Sanitizes and normalizes assignment data
 * @param assignment Raw assignment object
 * @returns Normalized assignment object
 */
export const normalizeAssignment = (assignment: any): IAssignment => {
  return {
    schoolName: (assignment.schoolName || 'Educational Institution').trim(),
    subject: (assignment.subject || 'General').trim(),
    className: (assignment.className || 'General Class').trim(),
    timeAllowed: (assignment.timeAllowed || '60 minutes').trim(),
    totalMarks: Math.max(0, Number(assignment.totalMarks) || 0),
    sections: (assignment.sections || []).map((section: any, sIdx: number) => ({
      title: (section.title || '').trim(),
      instruction: (section.instruction || '').trim(),
      questions: (section.questions || []).map((q: any, qIdx: number) => ({
        questionText: (q.questionText || '').trim(),
        difficulty: q.difficulty || 'Moderate',
        marks: Math.max(0.5, Number(q.marks) || 1),
        questionNumber: sIdx * 100 + qIdx + 1, // Auto-generate if missing
      })),
    })),
    answerKey: (assignment.answerKey || []).map((ans: any) => ({
      questionNumber: Number(ans.questionNumber),
      answerText: (ans.answerText || '').trim(),
    })),
  };
};
