/**
 * PDF Layout Helper Utilities
 * Provides helper functions for consistent styling and layout
 */

import PDFDocument from 'pdfkit';
import { PDFConfig, DEFAULT_PDF_CONFIG } from './pdf-config';

export class PDFLayoutHelper {
  private config: PDFConfig;
  private doc: typeof PDFDocument;

  constructor(doc: typeof PDFDocument, config: PDFConfig = DEFAULT_PDF_CONFIG) {
    this.doc = doc;
    this.config = config;
  }

  /**
   * Draw a horizontal line divider
   */
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

  /**
   * Draw a double line divider (stronger visual break)
   */
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

  /**
   * Draw header section with institution details
   */
  drawHeader(
    schoolName: string,
    subject: string,
    className: string
  ): void {
    // School Name
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.titleFontSize)
      .fillColor(this.config.colors.header)
      .text(schoolName, { align: 'center' });
    this.doc.moveDown(0.3);

    // Subject and Class
    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text);
    this.doc.text(`Subject: ${subject}`, { align: 'center' });
    this.doc.text(`Class: ${className}`, { align: 'center' });
    this.doc.moveDown(0.6);
  }

  /**
   * Draw exam metadata (time, marks)
   */
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

  /**
   * Draw student information fields
   */
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

  /**
   * Draw section heading
   */
  drawSectionHeading(sectionLetter: string, sectionTitle: string): void {
    // Section letter and title
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
      .text(sectionTitle, { align: 'left' });
    this.doc.moveDown(0.2);
  }

  /**
   * Draw section instructions
   */
  drawSectionInstructions(instruction: string): void {
    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.smallFontSize + 1)
      .fillColor(this.config.colors.text)
      .text(instruction, { align: 'left' });
    this.doc.moveDown(0.8);
  }

  /**
   * Draw a question with proper layout
   * Returns the height consumed
   */
  drawQuestion(
    questionNumber: number,
    questionText: string,
    difficulty: string,
    marks: number
  ): number {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;

    const currentY = this.doc.y;
    const contentWidth = pageWidth - leftMargin - rightMargin - 110; // Reserve space for marks

    // Question label
    const label = `${questionNumber}. [${difficulty}] ${questionText}`;
    const marksLabel = `[${marks} Mark${marks > 1 ? 's' : ''}]`;

    this.doc
      .font(this.config.fonts.default)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text);

    // Draw question text
    this.doc.text(label, leftMargin, currentY, {
      width: contentWidth,
      lineGap: 2,
    });

    const questionEndY = this.doc.y;

    // Draw marks on the right
    this.doc.text(
      marksLabel,
      pageWidth - rightMargin - 100,
      currentY,
      {
        align: 'right',
        width: 90,
      }
    );

    // Ensure Y position advances properly
    this.doc.y = Math.max(questionEndY, this.doc.y);
    this.doc.moveDown(this.config.spacing.questionGap);

    return this.doc.y - currentY;
  }

  /**
   * Draw answer key item
   */
  drawAnswerKeyItem(
    questionNumber: number,
    answerText: string
  ): void {
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

  /**
   * Draw footer with pagination
   */
  drawFooter(subject: string, pageNum: number, totalPages: number): void {
    const pageWidth = this.config.sizes.pageWidth;
    const leftMargin = this.config.margins.left;
    const rightMargin = this.config.margins.right;
    const footerY = this.config.sizes.pageHeight - this.config.margins.bottom + 10;

    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.smallFontSize)
      .fillColor(this.config.colors.footer);

    // Subject footer
    this.doc.text(
      `Subject: ${subject} | Generated by Veda AI`,
      leftMargin,
      footerY,
      { align: 'left', width: pageWidth - leftMargin - rightMargin - 100 }
    );

    // Pagination
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - rightMargin - 80,
      footerY,
      { align: 'right', width: 70 }
    );
  }

  /**
   * Check if page break is needed
   */
  needsPageBreak(minSpaceRequired: number = 100): boolean {
    const footerHeight = this.config.margins.bottom;
    return this.doc.y > this.config.sizes.pageHeight - footerHeight - minSpaceRequired;
  }

  /**
   * Add a new page (used for page breaks)
   */
  addPage(): void {
    this.doc.addPage();
  }

  /**
   * Draw instructions section
   */
  drawInstructions(): void {
    this.doc
      .font(this.config.fonts.italic)
      .fontSize(this.config.sizes.bodyFontSize - 1)
      .fillColor(this.config.colors.text)
      .text('All questions are compulsory unless stated otherwise.');
    this.doc.moveDown(1);
  }

  /**
   * Draw "End of Question Paper" signifier
   */
  drawEndOfPaper(): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.bodyFontSize)
      .fillColor(this.config.colors.text)
      .text('End of Question Paper', { align: 'center' });
    this.doc.moveDown(1);
  }

  /**
   * Draw answer key header
   */
  drawAnswerKeyHeader(): void {
    this.doc
      .font(this.config.fonts.bold)
      .fontSize(this.config.sizes.titleFontSize - 2)
      .fillColor(this.config.colors.header)
      .text('Answer Key', { align: 'center' });
    this.doc.moveDown(0.2);

    this.drawDivider('#000000', 1.5);
  }
}
