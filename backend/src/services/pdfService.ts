import PDFDocument from 'pdfkit';
import { IAssignment } from '../models/Assignment';
import fs from 'fs';
import path from 'path';



/**
 * Generates an exam-style PDF for an assignment and returns it as a Buffer.
 */
export const generateAssignmentPDFBuffer = (assignment: IAssignment): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      // Collect binary chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        reject(err);
      });

      // --- Header Section ---
      doc.font('Helvetica-Bold');
      doc.fontSize(18).text(assignment.schoolName || 'Delhi Public School, Sector-4, Bokaro', { align: 'center' });
      doc.moveDown(0.3);

      doc.font('Helvetica');
      doc.fontSize(13).text(`Subject: ${assignment.subject || 'Science'}`, { align: 'center' });
      doc.fontSize(11).text(`Class: ${assignment.className || 'Grade 8'}`, { align: 'center' });
      doc.moveDown(0.6);

      // Single horizontal line divider
      const pageWidth = doc.page.width;
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).strokeColor('#888888').lineWidth(1).stroke();
      doc.moveDown(0.5);

      // Time allowed and Maximum marks details
      const detailsY = doc.y;
      doc.font('Helvetica-Bold');
      doc.fontSize(10).text(`Time Allowed: ${assignment.timeAllowed || '45 minutes'}`, 50, detailsY);
      doc.text(`Maximum Marks: ${assignment.totalMarks || 0}`, pageWidth - 200, detailsY, { align: 'right', width: 150 });
      doc.moveDown(0.8);

      // Another line divider
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).strokeColor('#888888').stroke();
      doc.moveDown(0.8);

      // Instructions
      doc.font('Helvetica-Oblique');
      doc.fontSize(10).text('All questions are compulsory unless stated otherwise.', 50, doc.y);
      doc.moveDown(1);

      // Student Information Box (Figma Stacked Underlines Layout)
      doc.font('Helvetica');
      doc.fontSize(10).text('Name: ____________________________________________________', 50, doc.y);
      doc.moveDown(0.5);
      doc.text('Roll Number: _____________________________________________', 50, doc.y);
      doc.moveDown(0.5);
      doc.text(`Class: ${assignment.className || 'Grade 8'} Section: ______________________________________`, 50, doc.y);
      doc.moveDown(1.2);


      // Double horizontal border to start the test paper
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).strokeColor('#000000').lineWidth(1.5).stroke();
      doc.moveTo(50, doc.y + 3).lineTo(pageWidth - 50, doc.y + 3).strokeColor('#000000').lineWidth(0.5).stroke();
      doc.moveDown(1.5);

      // Questions Rendering
      let totalQuestionIndex = 1;

      if (assignment.sections && assignment.sections.length > 0) {
        assignment.sections.forEach((section) => {
          // Draw Section Title
          doc.font('Helvetica-Bold');
          doc.fontSize(12).text(section.title, { align: 'center' });
          doc.moveDown(0.2);

          // Section instructions
          doc.font('Helvetica-Oblique');
          doc.fontSize(9).text(section.instruction, { align: 'center' });
          doc.moveDown(0.8);

          // List questions in section
          if (section.questions && section.questions.length > 0) {
            section.questions.forEach((q) => {
              const textY = doc.y;
              const label = `${totalQuestionIndex}. [${q.difficulty}]  ${q.questionText}`;
              const marksLabel = `[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`;

              // Check if we need a page break (prevent orphans)
              if (doc.y > doc.page.height - 100) {
                doc.addPage();
              }

              // Write question text left, marks text right
              doc.font('Helvetica');
              doc.fontSize(10).text(label, 50, doc.y, { width: pageWidth - 160 });
              doc.text(marksLabel, pageWidth - 100, textY, { align: 'right', width: 50 });
              doc.moveDown(0.8);



              totalQuestionIndex++;
            });
          }

          doc.moveDown(1.2);
        });
      }

      // Add "End of Question Paper" signifier
      doc.font('Helvetica-Bold');
      doc.fontSize(10).text('End of Question Paper', { align: 'center' });
      doc.moveDown(1);

      // --- Answer Key Section (New Page) ---
      doc.addPage();
      
      doc.fontSize(16).text('Answer Key', { align: 'center' });
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(pageWidth - 50, doc.y).strokeColor('#000000').lineWidth(1.5).stroke();
      doc.moveDown(1.5);

      if (assignment.answerKey && assignment.answerKey.length > 0) {
        assignment.answerKey.forEach((ans) => {
          // Check for page break
          if (doc.y > doc.page.height - 80) {
            doc.addPage();
          }

          const numLabel = `${ans.questionNumber}.`;
          const numY = doc.y;

          doc.font('Helvetica-Bold');
          doc.fontSize(10).text(numLabel, 50, numY, { width: 25 });
          
          doc.font('Helvetica');
          doc.fontSize(10).text(ans.answerText, 75, numY, { width: pageWidth - 125 });
          doc.moveDown(1);
        });
      }

      // End of Document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
