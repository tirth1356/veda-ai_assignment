/**
 * PDF Generation Service
 * Main service for generating assignment PDFs with advanced error handling
 * and layout management
 */

import PDFDocument from 'pdfkit';
import { IAssignment } from './assignment-validator';
import { PDFConfig, DEFAULT_PDF_CONFIG, PDF_LIMITS } from './pdf-config';
import { PDFLayoutHelper } from './pdf-layout-helper';
import {
  PDFError,
  ValidationError,
  PDFTimeoutError,
  PDFMemoryError,
  PDFStreamError,
} from './pdf-errors';
import { validateAssignment, normalizeAssignment } from './assignment-validator';

export interface PDFGenerationOptions {
  config?: PDFConfig;
  timeout?: number;
  includeAnswerKey?: boolean;
  generateMetadata?: boolean;
}

export interface PDFGenerationResult {
  buffer: Buffer;
  pageCount: number;
  fileSize: number;
  generatedAt: Date;
}

export class AssignmentPDFGenerator {
  private config: PDFConfig;
  private timeout: number;

  constructor(options: PDFGenerationOptions = {}) {
    this.config = options.config || DEFAULT_PDF_CONFIG;
    this.timeout = options.timeout || PDF_LIMITS.TIMEOUT_MS;
  }

  /**
   * Main method to generate PDF buffer
   * @param assignment Assignment data to generate PDF from
   * @param options Generation options
   * @returns Promise<PDFGenerationResult>
   */
  async generateAssignmentPDF(
    assignment: any,
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    // Normalize data first to provide fallbacks for older assignments
    const normalizedAssignment = normalizeAssignment(assignment);

    // Validate the normalized input data
    const validationErrors = validateAssignment(normalizedAssignment);
    if (validationErrors.length > 0) {
      throw new ValidationError(
        'Assignment validation failed',
        validationErrors
      );
    }

    // Generate PDF with timeout
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

  /**
   * Internal PDF generation logic
   */
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
        const startTime = Date.now();

        // Handle data events
        doc.on('data', (chunk: Buffer) => {
          // Check buffer size limit
          totalSize += chunk.length;
          if (totalSize > PDF_LIMITS.MAX_BUFFER_SIZE) {
            doc.end();
            reject(
              new PDFMemoryError(totalSize, PDF_LIMITS.MAX_BUFFER_SIZE)
            );
            return;
          }
          chunks.push(chunk);
        });

        // Handle end event
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

        // Handle errors
        doc.on('error', (error: Error) => {
          reject(new PDFStreamError(error));
        });

        // Start rendering
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

  /**
   * Render PDF content
   */
  private renderPDF(
    doc: typeof PDFDocument,
    assignment: IAssignment,
    options: PDFGenerationOptions
  ): void {
    const helper = new PDFLayoutHelper(doc, this.config);
    const pageWidth = this.config.sizes.pageWidth;

    try {
      // --- Header Section ---
      helper.drawHeader(assignment.schoolName, assignment.subject, assignment.className);
      helper.drawDivider();

      // --- Metadata Section ---
      helper.drawMetadata(assignment.timeAllowed, assignment.totalMarks);
      helper.drawDivider();

      // --- Instructions and Student Info ---
      helper.drawInstructions();
      helper.drawStudentInfo();

      // --- Double Border for Questions ---
      helper.drawDoubleDivider();

      // --- Questions Section ---
      this.renderQuestions(doc, helper, assignment);

      // --- End of Paper ---
      helper.drawEndOfPaper();

      // --- Answer Key Section ---
      if (options.includeAnswerKey !== false && assignment.answerKey) {
        doc.addPage();
        helper.drawAnswerKeyHeader();
        this.renderAnswerKey(doc, helper, assignment.answerKey);
      }

      // --- Footer with Pagination ---
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

  /**
   * Render questions from sections
   */
  private renderQuestions(
    doc: typeof PDFDocument,
    helper: PDFLayoutHelper,
    assignment: IAssignment
  ): void {
    let totalQuestionIndex = 1;

    assignment.sections.forEach((section, sIndex) => {
      const sectionLetter = String.fromCharCode(65 + sIndex); // A, B, C...

      // Draw section heading
      helper.drawSectionHeading(sectionLetter, section.title);

      // Draw section instructions
      helper.drawSectionInstructions(section.instruction);

      // Draw questions
      if (section.questions && section.questions.length > 0) {
        section.questions.forEach((question) => {
          // Check for page break (reserve 100px for footer)
          if (helper.needsPageBreak(100)) {
            helper.addPage();
          }

          // Draw question
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

  /**
   * Render answer key
   */
  private renderAnswerKey(
    doc: typeof PDFDocument,
    helper: PDFLayoutHelper,
    answerKey: Array<{ questionNumber: number; answerText: string }>
  ): void {
    answerKey.forEach((answer) => {
      // Check for page break
      if (helper.needsPageBreak(80)) {
        helper.addPage();
        helper.drawAnswerKeyHeader();
      }

      helper.drawAnswerKeyItem(answer.questionNumber, answer.answerText);
    });
  }

  /**
   * Add footers to all pages
   */
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

/**
 * Convenience function for quick PDF generation
 */
export const generateAssignmentPDFBuffer = async (
  assignment: IAssignment,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  const generator = new AssignmentPDFGenerator(options);
  const result = await generator.generateAssignmentPDF(assignment, options);
  return result.buffer;
};

/**
 * Convenience function for file-based generation
 */
export const generateAssignmentPDFFile = async (
  assignment: IAssignment,
  filePath: string,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> => {
  const fs = await import('fs').then(m => m.promises);
  const generator = new AssignmentPDFGenerator(options);
  const result = await generator.generateAssignmentPDF(assignment, options);

  await fs.writeFile(filePath, result.buffer);

  return result;
};
