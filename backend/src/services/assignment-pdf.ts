/**
 * Assignment PDF Generator (Puppeteer / HTML-to-PDF Version)
 * Generates perfect, tightly controlled PDFs using HTML and CSS
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import { IAssignment } from '../models/Assignment';

export interface PDFGenerationOptions {
  includeAnswerKey?: boolean;
}

export interface PDFGenerationResult {
  buffer: Buffer;
  generatedAt: Date;
}

/**
 * Sanitizes and normalizes assignment data for HTML rendering
 */
function normalizeAssignment(assignment: any): IAssignment {
  return {
    ...assignment,
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
  } as IAssignment;
}

/**
 * Generates the HTML layout for the assignment
 */
function generateHTML(assignment: IAssignment, options: PDFGenerationOptions): string {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @page {
        margin: 20mm;
      }
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        color: #000;
        font-size: 14px;
        line-height: 1.6;
      }
      .header {
        text-align: center;
        border-bottom: 1px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .school-name {
        font-size: 24px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .subject-class {
        font-size: 16px;
        margin-top: 5px;
      }
      .metadata {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        border-bottom: 1px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .student-info {
        margin-bottom: 25px;
        border-bottom: 3px double #000;
        padding-bottom: 25px;
        text-align: left; /* Name/Roll/Section strictly on the left */
      }
      .student-info p {
        margin: 12px 0;
        font-size: 15px;
      }
      .instruction-box {
        font-style: italic;
        margin-bottom: 20px;
      }
      .section {
        margin-bottom: 40px;
      }
      .section-header {
        text-align: center; /* Section A, B, C centered */
        margin-bottom: 20px;
      }
      .section-title {
        font-size: 18px;
        font-weight: bold;
      }
      .section-instruction {
        font-style: italic;
        color: #444;
        margin-top: 5px;
      }
      .question {
        display: flex;
        justify-content: space-between;
        margin-bottom: 25px; /* Proper padding between questions */
        page-break-inside: avoid; /* Prevents question splitting across pages */
      }
      .question-content {
        width: 85%;
        padding-right: 20px;
      }
      .question-marks {
        width: 15%;
        text-align: right;
        font-weight: bold;
        white-space: nowrap;
      }
      .end-of-paper {
        text-align: center;
        font-weight: bold;
        margin-top: 50px;
        margin-bottom: 30px;
      }
      .answer-key {
        page-break-before: always;
      }
      .answer-header {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .answer-item {
        margin-bottom: 15px;
        page-break-inside: avoid;
        display: flex;
      }
      .answer-num {
        font-weight: bold;
        width: 40px;
      }
      .answer-text {
        flex: 1;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="school-name">${assignment.schoolName}</div>
      <div class="subject-class">Subject: ${assignment.subject} | Class: ${assignment.className}</div>
    </div>
    
    <div class="metadata">
      <div>Time Allowed: ${assignment.timeAllowed}</div>
      <div>Maximum Marks: ${assignment.totalMarks}</div>
    </div>

    <div class="instruction-box">
      All questions are compulsory unless stated otherwise.
    </div>

    <div class="student-info">
      <p>Name: ____________________________________________________</p>
      <p>Roll Number: _____________________________________________</p>
      <p>Section: _________________________________________________</p>
    </div>
  `;

  // Render Questions
  let globalQNum = 1;
  (assignment.sections || []).forEach((section, sIndex) => {
    const letter = String.fromCharCode(65 + sIndex);
    
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-title">Section ${letter}: ${section.title}</div>
        <div class="section-instruction">${section.instruction}</div>
      </div>
    `;

    section.questions.forEach((q) => {
      html += `
      <div class="question">
        <div class="question-content">
          <strong>${globalQNum}.</strong> [${q.difficulty}] ${q.questionText}
        </div>
        <div class="question-marks">
          [${q.marks} Mark${q.marks > 1 ? 's' : ''}]
        </div>
      </div>
      `;
      globalQNum++;
    });

    html += `</div>`;
  });

  html += `<div class="end-of-paper">--- End of Question Paper ---</div>`;

  // Answer Key (opt-in only, disabled by default per user request)
  if (options.includeAnswerKey === true && assignment.answerKey && assignment.answerKey.length > 0) {
    html += `
    <div class="answer-key">
      <div class="answer-header">Answer Key</div>
    `;
    
    assignment.answerKey.forEach((ans) => {
      html += `
      <div class="answer-item">
        <div class="answer-num">${ans.questionNumber}.</div>
        <div class="answer-text">${ans.answerText}</div>
      </div>
      `;
    });
    
    html += `</div>`;
  }

  html += `
  </body>
  </html>
  `;

  return html;
}

/**
 * Main function to generate PDF Buffer from Assignment Data using Puppeteer
 */
export const generateAssignmentPDFBuffer = async (
  rawAssignment: any,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  const assignment = normalizeAssignment(rawAssignment);
  const htmlContent = generateHTML(assignment, options);

  // Launch Puppeteer headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    
    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate PDF
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>', // Empty header
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; font-family: Arial, sans-serif; padding: 0 20px;">
          <span style="float: left;">Subject: ${assignment.subject} | Generated by Veda AI</span>
          <span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
};

/**
 * Convenience function for file-based generation
 */
export const generateAssignmentPDFFile = async (
  assignment: any,
  filePath: string,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const buffer = await generateAssignmentPDFBuffer(assignment, options);
  fs.writeFileSync(filePath, buffer);
};
