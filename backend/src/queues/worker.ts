import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { redisConfig } from '../config/redis';
import Assignment from '../models/Assignment';
import { generateAssessmentPaper } from '../services/aiService';
import { emitAssignmentProgress } from '../config/socket';

export const initWorker = (): Worker => {
  const worker = new Worker(
    'assignment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;
      console.log(`Worker picked up generation job for assignment: ${assignmentId}`);

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        console.error(`Assignment not found: ${assignmentId}`);
        throw new Error(`Assignment with ID ${assignmentId} not found`);
      }

      try {
        // Step 1: Initializing
        assignment.status = 'PROCESSING';
        assignment.progress = 10;
        await assignment.save();
        emitAssignmentProgress(assignmentId, {
          status: 'PROCESSING',
          progress: 10,
          message: 'Initializing generation process...',
        });

        // Step 2: Read reference file if uploaded
        let referenceText = '';
        if (assignment.filePath) {
          const absolutePath = path.resolve(assignment.filePath);
          if (fs.existsSync(absolutePath)) {
            console.log(`Reading reference file at: ${absolutePath}`);
            emitAssignmentProgress(assignmentId, {
              status: 'PROCESSING',
              progress: 25,
              message: 'Reading and parsing uploaded document...',
            });

            if (absolutePath.toLowerCase().endsWith('.pdf')) {
              const fileBuffer = fs.readFileSync(absolutePath);
              const parsedPdf = await pdfParse(fileBuffer);
              referenceText = parsedPdf.text;
              console.log(`Parsed PDF text successfully. Length: ${referenceText.length} characters.`);
            } else {
              referenceText = fs.readFileSync(absolutePath, 'utf-8');
              console.log(`Parsed text file successfully. Length: ${referenceText.length} characters.`);
            }
          } else {
            console.warn(`Attached file not found at path: ${absolutePath}`);
          }
        }

        // Step 3: Run Creator, Reviewer, and Solver Multi-Agent Pipeline
        const aiResult = await generateAssessmentPaper({
          title: assignment.title,
          className: assignment.className,
          subject: assignment.subject,
          difficulty: assignment.difficulty,
          questionTypes: assignment.questionTypes.map((qt) => ({
            type: qt.type,
            count: qt.count,
            marks: qt.marks,
          })),
          additionalInstructions: assignment.additionalInstructions,
          referenceText: referenceText || undefined,
          existingPaper: assignment.sections && assignment.sections.length > 0 
            ? { sections: assignment.sections, answerKey: assignment.answerKey }
            : undefined,
        }, (message, progress) => {
          // Callback to update DB and emit real-time updates for each agent state
          assignment.status = 'PROCESSING';
          assignment.progress = progress;
          assignment.save().catch(err => console.error('Error saving progression state:', err));
          
          emitAssignmentProgress(assignmentId, {
            status: 'PROCESSING',
            progress,
            message,
          });
        });

        // Step 4: Saving generated data
        emitAssignmentProgress(assignmentId, {
          status: 'PROCESSING',
          progress: 95,
          message: 'Finalizing database records...',
        });

        assignment.sections = aiResult.sections;
        assignment.answerKey = aiResult.answerKey;
        // Do not overwrite subject, className, or timeAllowed to preserve teacher's input
        
        assignment.markModified('sections');
        assignment.markModified('answerKey');
        
        assignment.status = 'COMPLETED';
        assignment.progress = 100;
        await assignment.save();

        console.log(`Successfully completed assignment generation: ${assignmentId}`);
        emitAssignmentProgress(assignmentId, {
          status: 'COMPLETED',
          progress: 100,
          message: 'Assessment paper successfully generated!',
        });

      } catch (err: any) {
        console.error(`Error processing job in worker:`, err);
        assignment.status = 'FAILED';
        assignment.progress = 100;
        assignment.error = err.message || 'Unknown generation failure';
        await assignment.save();

        emitAssignmentProgress(assignmentId, {
          status: 'FAILED',
          progress: 100,
          error: err.message || 'Failed to generate assignment using AI',
        });
        
        throw err;
      }
    },
    {
      connection: redisConfig,
      concurrency: 1,
    }
  );

  worker.on('active', (job) => {
    console.log(`Job ${job.id} has started`);
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
  });

  console.log('BullMQ Background worker initialized.');
  return worker;
};
