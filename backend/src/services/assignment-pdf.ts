/**
 * Complete Assignment PDF Generator
 * Self-contained module with all functionality in a single file
 * No external dependencies except pdfkit
 */

import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

export interface PDFConfig {
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fonts: {
    default: string;
    bold: string;
    italic: string;
  };
  colors: {
    text: string;
    divider: string;
    header: string;
    footer: string;
  };
  sizes: {
    pageWidth: number;
    pageHeight: number;
    titleFontSize: number;
    headingFontSize: number;
    bodyFontSize: number;
    smallFontSize: number;
  };
  spacing: {
    sectionGap: number;
    questionGap: number;
    lineHeight: number;
  };
}

export interface PDFGenerationOptions {
  config?: PDFConfig;
  timeout?: number;
  includeAnswerKey?: boolean;
}

export interface PDFGenerationResult {
  buffer: Buffer;
  pageCount: number;
  fileSize: number;
  generatedAt: Date;
}

export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class PDFError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PDFError';
  }
}

export class ValidationError extends PDFError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class PDFTimeoutError extends PDFError {
  constructor(timeoutMs: number) {
    super(
      `PDF generation timed out after ${timeoutMs}ms`,
      'PDF_TIMEOUT',
      504,
      { timeoutMs }
    );
    this.name = 'PDFTimeoutError';
  }
}

export class PDFMemoryError extends PDFError {
  constructor(bufferSize: number, maxSize: number) {
    super(
      `Generated PDF exceeds maximum size: ${bufferSize} > ${maxSize} bytes`,
      'PDF_MEMORY_ERROR',
      413,
      { bufferSize, maxSize }
    );
    this.name = 'PDFMemoryError';
  }
}

export class PDFStreamError extends PDFError {
  constructor(originalError: Error) {
    super(
      `PDF stream error: ${originalError.message}`,
      'PDF_STREAM_ERROR',
      500,
      { originalError: originalError.message }
    );
    this.name = 'PDFStreamError';
  }
}

// ============================================================================
// CONFIGURATION DEFAULTS
// ============================================================================

const DEFAULT_PDF_CONFIG: PDFConfig = {
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  fonts: {
    default: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
  },
  colors: {
    text: '#000000',
    divider: '#888888',
    header: '#1a1a1a',
    footer: '#666666',
  },
  sizes: {
    pageWidth: 595,
    pageHeight: 842,
    titleFontSize: 18,
    headingFontSize: 14,
    bodyFontSize: 10,
    smallFontSize: 8,
  },
  spacing: {
    sectionGap: 1.5,
    questionGap: 1.5,
    lineHeight: 1.5,
  },
};

const PDF_LIMITS = {
  MAX_QUESTIONS_PER_SECTION: 100,
  MAX_SECTIONS: 26,
  MAX_TOTAL_QUESTIONS: 500,
  MIN_MARKS_PER_QUESTION: 0.5,
  MAX_MARKS_PER_QUESTION: 100,
  TIMEOUT_MS: 30000,
  MAX_BUFFER_SIZE: 50 * 1024 * 1024,
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateAssignment(assignment: any): IValidationError[] {
  const errors: IValidationError[] = [];

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

  if (!Array.isArray(assignment.sections) || assignment.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'At least one section is required',
      value: assignment.sections,
    });
    return errors;
  }

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
      return;
    }

    if (section.questions.length > 100) {
      errors.push({
        field: `sections[${sIndex}].questions`,
        message: 'Maximum 100 questions per section',
        value: section.questions.length,
      });
    }

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
  });

  if (totalQuestions > 500) {
    errors.push({
      field: 'sections',
      message: 'Total questions across all sections cannot exceed 500',
      value: totalQuestions,
    });
  }

  return errors;
}

function normalizeAssignment(assignment: any): IAssignment {
  return {
    schoolName: (assignment.schoolName || '').trim(),
    subject: (assignment.subject || '').trim(),
    className: (assignment.className || '').trim(),
    timeAllowed: (assignment.timeAllowed || '').trim(),
    totalMarks: Math.max(0, Number(assignment.totalMarks) || 0),
    sections: (assignment.sections || []).map((section: any) => ({
      title: (section.title || '').trim(),
      instruction: (section.instruction || '').trim(),
      questions: (section.questions || []).map((q: any) => ({
        questionText: (q.questionText || '').trim(),
        difficulty: q.difficulty || 'Moderate',
        marks: Math.max(0.5, Number(q.marks) || 1),
      })),
    })),
    answerKey: (assignment.answerKey || []).map((ans: any) => ({
      questionNumber: Number(ans.questionNumber),
      answerText: (ans.answerText || '').trim(),
    })),
  };
}

// ============================================================================
// LAYOUT HELPER
// ============================================================================

class PDFLayoutHelper {
  constructor(private doc: typeof PDFDocument, private config: PDFConfig) {}

  drawDivider(
    strokeColor: string = this.config.colors.divider,
    lineWidth: number = 1,
    spacing: number = 0.5
  ): void {
    this.doc.strokeColor(strokeColor).lineWidth(lineWidth);
    this.doc
      .moveTo(this.config.margins.left, this.doc.y)
      .lineTo(
        this.config.sizes.pageWidth - this.config.margins.right,
        this.doc.y
      )
      .stroke();
    this.doc.moveDown(spacing);
  }

  drawDoubleDivider(spacing: number = 1.5): void {
    this.doc.strokeColor('#000000').lineWidth(1.5);
    this.doc
      .moveTo(this.config.margins.left, this.doc.y)
      .lineTo(
        this.config.sizes.pageWidth - this.config.margins.right,
        this.doc.y
      )
      .stroke();

    this.doc.lineWidth(0.5);
    this.doc.moveTo(this.config.margins.left, this.doc.y + 3);
    this.doc
      .lineTo(
        this.config.sizes.pageWidth - this.config.margins.right,
        this.doc.y + 3
      )
      .stroke();

    this.doc.moveDown(spacing);
  }

  drawHeader(schoolName: string, subject: string, className: string): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.titleFontSize)
      .fillColor(this.config.colors.header)
      .text(schoolName, { align: 'center' });
    this.doc.moveDown(0.3);

    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text);
    this.doc.text(`Subject: ${subject}`, { align: 'center' });
    this.doc.text(`Class: ${className}`, { align: 'center' });
    this.doc.moveDown(0.6);
  }

  drawMetadata(timeAllowed: string, totalMarks: number): void {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;

    this.doc
      .font(this.config.fonts.bold)
      .fontSize(10)
      .fillColor(this.config.colors.text);

    this.doc.text(`Time Allowed: ${timeAllowed}`, leftMargin, this.doc.y);
    this.doc.text(
      `Maximum Marks: ${totalMarks}`,
      pageWidth - rightMargin - 150,
      this.doc.y - 14,
      { align: 'right', width: 140 }
    );
    this.doc.moveDown(0.8);
  }

  drawStudentInfo(): void {
    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text);

    this.doc.text('Name: ____________________________________________________');
    this.doc.moveDown(0.5);
    this.doc.text('Roll Number: _____________________________________________');
    this.doc.moveDown(0.5);
    this.doc.text('Section: _________________________________________________');
    this.doc.moveDown(1.2);
  }

  drawSectionHeading(sectionLetter: string, sectionTitle: string): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.headingFontSize)
      .fillColor(this.config.colors.header)
      .text(`Section ${sectionLetter}`, { align: 'center' });
    this.doc.moveDown(0.8);

    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.bodyFontSize + 1)
      .fillColor(this.config.colors.text)
      .text(sectionTitle, { align: 'center' });
    this.doc.moveDown(0.2);
  }

  drawSectionInstructions(instruction: string): void {
    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.smallFontSize + 1)
      .fillColor(this.config.colors.text)
      .text(instruction, { align: 'left' });
    this.doc.moveDown(0.8);
  }

  drawQuestion(
    questionNumber: number,
    questionText: string,
    difficulty: string,
    marks: number
  ): void {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;

    const currentY = this.doc.y;
    const contentWidth = pageWidth - leftMargin - rightMargin - 110;

    const label = `${questionNumber}. [${difficulty}] ${questionText}`;
    const marksLabel = `[${marks} Mark${marks > 1 ? 's' : ''}]`;

    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text);

    this.doc.text(label, leftMargin, currentY, {
      width: contentWidth,
      lineGap: 2,
    });

    const questionEndY = this.doc.y;

    this.doc.text(marksLabel, pageWidth - rightMargin - 100, currentY, {
      align: 'right',
      width: 90,
    });

    this.doc.y = Math.max(questionEndY, this.doc.y);
    this.doc.moveDown(this.config.spacing.questionGap);
  }

  drawAnswerKeyItem(questionNumber: number, answerText: string): void {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;

    const numLabel = `${questionNumber}.`;
    const currentY = this.doc.y;

    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text)
      .text(numLabel, leftMargin, currentY, { width: 25 });

    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .text(answerText, leftMargin + 35, currentY, {
        width: pageWidth - leftMargin - rightMargin - 35,
        lineGap: 2,
      });

    this.doc.moveDown(1);
  }

  drawFooter(subject: string, pageNum: number, totalPages: number): void {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;
    const footerY = this.config.sizes.pageHeight - this.config.margins.bottom + 10;

    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.smallFontSize)
      .fillColor(this.config.colors.footer);

    this.doc.text(
      `Subject: ${subject} | Generated by PDF Generator`,
      leftMargin,
      footerY,
      { align: 'left', width: pageWidth - leftMargin - rightMargin - 100 }
    );

    this.doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - rightMargin - 80, footerY, {
      align: 'right',
      width: 70,
    });
  }

  drawInstructions(): void {
    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.bodyFontSize - 1)
      .fillColor(this.config.colors.text)
      .text('All questions are compulsory unless stated otherwise.');
    this.doc.moveDown(1);
  }

  drawEndOfPaper(): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text)
      .text('End of Question Paper', { align: 'center' });
    this.doc.moveDown(1);
  }

  drawAnswerKeyHeader(): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.titleFontSize - 2)
      .fillColor(this.config.colors.header)
      .text('Answer Key', { align: 'center' });
    this.doc.moveDown(0.2);
    this.drawDivider('#000000', 1.5);
  }

  needsPageBreak(minSpaceRequired: number = 100): boolean {
    const footerHeight = this.config.margins.bottom;
    return this.doc.y > this.config.sizes.pageHeight - footerHeight - minSpaceRequired;
  }

  addPage(): void {
    this.doc.addPage();
  }
}

// ============================================================================
// MAIN PDF GENERATOR
// ============================================================================

export class AssignmentPDFGenerator {
  private config: PDFConfig;
  private timeout: number;

  constructor(options: PDFGenerationOptions = {}) {
    this.config = options.config || DEFAULT_PDF_CONFIG;
    this.timeout = options.timeout || PDF_LIMITS.TIMEOUT_MS;
  }

  async generateAssignmentPDF(
    assignment: any,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    // Normalize first
    const normalizedAssignment = normalizeAssignment(assignment);

    // Validate
    const validationErrors = validateAssignment(normalizedAssignment);
    if (validationErrors.length > 0) {
      throw new ValidationError('Assignment validation failed', validationErrors);
    }

    // Generate with timeout
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new PDFTimeoutError(this.timeout));
      }, this.timeout);

      this.generatePDFInternal(normalizedAssignment, options)
        .then((result) => {
          clearTimeout(timeoutHandle);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        });
    });
  }

  private generatePDFInternal(
    assignment: IAssignment,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: this.config.margins.left,
          size: 'A4',
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        let totalSize = 0;

        doc.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize > PDF_LIMITS.MAX_BUFFER_SIZE) {
            doc.end();
            reject(new PDFMemoryError(totalSize, PDF_LIMITS.MAX_BUFFER_SIZE));
            return;
          }
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const pageCount = doc.bufferedPageRange().count;
          resolve({
            buffer,
            pageCount,
            fileSize: buffer.length,
            generatedAt: new Date(),
          });
        });

        doc.on('error', (error: Error) => {
          reject(new PDFStreamError(error));
        });

        this.renderPDF(doc, assignment, options);
        doc.end();
      } catch (error) {
        reject(
          error instanceof PDFError
            ? error
            : new PDFError(
                `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
                'UNKNOWN_ERROR',
                500
              )
        );
      }
    });
  }

  private renderPDF(
    doc: typeof PDFDocument,
    assignment: IAssignment,
    options: PDFGenerationOptions
  ): void {
    const helper = new PDFLayoutHelper(doc, this.config);

    try {
      // Header
      helper.drawHeader(assignment.schoolName, assignment.subject, assignment.className);
      helper.drawDivider();

      // Metadata
      helper.drawMetadata(assignment.timeAllowed, assignment.totalMarks);
      helper.drawDivider();

      // Instructions & Student Info
      helper.drawInstructions();
      helper.drawStudentInfo();

      // Double Border
      helper.drawDoubleDivider();

      // Questions
      this.renderQuestions(doc, helper, assignment);

      // End of Paper
      helper.drawEndOfPaper();

      // Answer Key (disabled by default based on request)
      if (options.includeAnswerKey === true && assignment.answerKey) {
        doc.addPage();
        helper.drawAnswerKeyHeader();
        this.renderAnswerKey(doc, helper, assignment.answerKey);
      }

      // Footers
      this.addFooters(doc, assignment);
    } catch (error) {
      throw error instanceof PDFError
        ? error
        : new PDFError(
            `Rendering error: ${error instanceof Error ? error.message : 'Unknown'}`,
            'RENDERING_ERROR',
            500
          );
    }
  }

  private renderQuestions(
    doc: typeof PDFDocument,
    helper: PDFLayoutHelper,
    assignment: IAssignment
  ): void {
    let totalQuestionIndex = 1;

    assignment.sections.forEach((section, sIndex) => {
      const sectionLetter = String.fromCharCode(65 + sIndex);

      helper.drawSectionHeading(sectionLetter, section.title);
      helper.drawSectionInstructions(section.instruction);

      if (section.questions && section.questions.length > 0) {
        section.questions.forEach((question) => {
          // Removed manual helper.needsPageBreak to stop blank page generation
          helper.drawQuestion(
            totalQuestionIndex,
            question.questionText,
            question.difficulty,
            question.marks
          );

          totalQuestionIndex++;
        });
      }

      doc.moveDown(this.config.spacing.sectionGap);
    });
  }

  private renderAnswerKey(
    doc: typeof PDFDocument,
    helper: PDFLayoutHelper,
    answerKey: Array<{ questionNumber: number; answerText: string }>
  ): void {
    answerKey.forEach((answer) => {
      // Manual page break removed to prevent blank pages

      helper.drawAnswerKeyItem(answer.questionNumber, answer.answerText);
    });
  }

  private addFooters(doc: typeof PDFDocument, assignment: IAssignment): void {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      new PDFLayoutHelper(doc, this.config).drawFooter(
        assignment.subject,
        i + 1,
        range.count
      );
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const generateAssignmentPDFBuffer = async (
  assignment: IAssignment,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  const generator = new AssignmentPDFGenerator(options);
  const result = await generator.generateAssignmentPDF(assignment, options);
  return result.buffer;
};

export const generateAssignmentPDFFile = async (
  assignment: IAssignment,
  filePath: string,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> => {
  const generator = new AssignmentPDFGenerator(options);
  const result = await generator.generateAssignmentPDF(assignment, options);
  fs.writeFileSync(filePath, result.buffer);
  return result;
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

// Example of how to use this module:
/*
import { generateAssignmentPDFBuffer, generateAssignmentPDFFile, IAssignment } from './assignment-pdf-generator-complete';

const assignment: IAssignment = {
  schoolName: 'Delhi Public School',
  subject: 'Mathematics',
  className: 'Grade 10',
  timeAllowed: '2 hours',
  totalMarks: 80,
  sections: [
    {
      title: 'Section A: Multiple Choice',
      instruction: 'Choose the correct option (1 mark each)',
      questions: [
        {
          questionText: 'What is 2 + 2?',
          difficulty: 'Easy',
          marks: 1,
        },
        {
          questionText: 'What is the square root of 144?',
          difficulty: 'Easy',
          marks: 1,
        },
      ],
    },
    {
      title: 'Section B: Short Answer',
      instruction: 'Answer in 2-3 lines (5 marks each)',
      questions: [
        {
          questionText: 'Define a prime number with examples.',
          difficulty: 'Medium',
          marks: 5,
        },
      ],
    },
  ],
  answerKey: [
    { questionNumber: 1, answerText: '4' },
    { questionNumber: 2, answerText: '12' },
    {
      questionNumber: 3,
      answerText:
        'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself. Examples: 2, 3, 5, 7, 11, 13...',
    },
  ],
};

// Generate PDF buffer
const buffer = await generateAssignmentPDFBuffer(assignment);
console.log(`Generated PDF: ${buffer.length} bytes`);

// Or save to file
const result = await generateAssignmentPDFFile(assignment, './exam.pdf');
console.log(`Saved to file: ${result.pageCount} pages, ${result.fileSize} bytes`);

// With custom config
const customOptions = {
  config: {
    ...DEFAULT_PDF_CONFIG,
    colors: {
      ...DEFAULT_PDF_CONFIG.colors,
      header: '#0066cc',
    },
  },
  timeout: 45000,
  includeAnswerKey: true,
};

const resultCustom = await generateAssignmentPDFFile(
  assignment,
  './exam-custom.pdf',
  customOptions
);
*/
