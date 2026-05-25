import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Assignment from '../models/Assignment';
import { addAssignmentGenerationJob } from '../queues/queue';
import { generateAssignmentPDFBuffer } from '../services/assignment-pdf-generator';
import { redisClient } from '../config/redis';
import { generateAssessmentPaper } from '../services/aiService';
import { emitAssignmentProgress } from '../config/socket';
import pdfParse from 'pdf-parse';
import { protect } from '../middleware/authMiddleware';



const router = express.Router();

// Setup Multer storage
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed.'));
    }
  },
});

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment creation task
 */
router.post('/', protect, upload.array('files', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      dueDate, 
      questionTypes, 
      additionalInstructions, 
      schoolName, 
      subject, 
      className, 
      timeAllowed,
      difficulty,
      libraryFileName,
      libraryOriginalName
    } = req.body;

    if (!dueDate) {
      res.status(400).json({ error: 'Due date is required.' });
      return;
    }

    let parsedQuestionTypes = [];
    try {
      parsedQuestionTypes = JSON.parse(questionTypes || '[]');
    } catch (err) {
      res.status(400).json({ error: 'Invalid questionTypes format. Must be JSON.' });
      return;
    }

    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      res.status(400).json({ error: 'At least one question type configuration is required.' });
      return;
    }

    // Compute totals
    let totalQuestions = 0;
    let totalMarks = 0;
    for (const qt of parsedQuestionTypes) {
      if (qt.count <= 0 || qt.marks <= 0) {
        res.status(400).json({ error: 'Question counts and marks must be greater than zero.' });
        return;
      }
      totalQuestions += qt.count;
      totalMarks += (qt.count * qt.marks);
    }

    const filePaths: string[] = [];
    const originalFileNames: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        filePaths.push(file.path);
        originalFileNames.push(file.originalname);
      });
    }

    if (filePaths.length === 0 && libraryFileName) {
      const safeName = path.basename(libraryFileName);
      const resolvedPath = path.join(uploadDir, safeName);
      if (fs.existsSync(resolvedPath)) {
        filePaths.push(`uploads/${safeName}`);
        originalFileNames.push(libraryOriginalName || safeName);
      }
    }

    // Create MongoDB entry
    const assignment = new Assignment({
      user: (req as any).user.id,
      title: title || 'Quiz',
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      additionalInstructions,
      schoolName: schoolName || undefined,
      subject: subject || undefined,
      className: className || undefined,
      timeAllowed: timeAllowed || undefined,
      difficulty: difficulty || undefined,
      totalQuestions,
      totalMarks,
      status: 'PENDING',
      progress: 0,
      filePaths: filePaths.length > 0 ? filePaths : undefined,
      originalFileNames: originalFileNames.length > 0 ? originalFileNames : undefined,
    });

    await assignment.save();

    // Trigger BullMQ background worker
    try {
      await addAssignmentGenerationJob(assignment._id.toString());
    } catch (queueError) {
      console.warn('BullMQ failed to enqueue job (Redis offline?). Falling back to synchronous processing.', queueError);
      // Run synchronously in background promise
      // runSyncGeneration(assignment._id.toString());
    }

    res.status(202).json({
      message: 'Assignment creation accepted. Generating questions in background.',
      assignmentId: assignment._id,
      files: req.files ? (req.files as Express.Multer.File[]).map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size
      })) : (filePaths.length > 0 ? [{
        filename: path.basename(filePaths[0]),
        originalName: originalFileNames[0],
        size: 0
      }] : undefined)
    });
  } catch (error: any) {
    console.error('Error creating assignment request:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * @route   GET /api/assignments
 * @desc    Get all assignments list (minimal details for list view)
 */
router.get('/', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await Assignment.find({ user: (req as any).user.id })
      .select('-sections -answerKey') // Omit large fields for listing
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

/**
 * @route   GET /api/assignments/:id
 * @desc    Get full details of a specific assignment
 */
router.get('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json(assignment);
  } catch (error: any) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
});

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete an assignment
 */
router.delete('/:id', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Clean up uploaded file if exists
    if (assignment.filePath) {
      const absolutePath = path.resolve(assignment.filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted file: ${absolutePath}`);
      }
    }

    // Clean up Redis PDF Cache
    await redisClient.del(`pdf:${req.params.id}`).catch(err => {
      console.error('Failed to invalidate Redis cache during deletion:', err);
    });

    await Assignment.findOneAndDelete({ _id: req.params.id, user: (req as any).user.id });
    res.json({ message: 'Assignment successfully deleted.' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

/**
 * @route   POST /api/assignments/:id/regenerate
 * @desc    Re-run generation for an assignment
 */
router.post('/:id/regenerate', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    assignment.status = 'PENDING';
    assignment.progress = 0;
    assignment.error = undefined;
    assignment.sections = [];
    assignment.answerKey = [];
    await assignment.save();

    // Invalidate Redis PDF Cache
    await redisClient.del(`pdf:${req.params.id}`).catch(err => {
      console.error('Failed to invalidate Redis cache during regeneration:', err);
    });

    await addAssignmentGenerationJob(assignment._id.toString());

    res.json({
      message: 'Regeneration started.',
      assignmentId: assignment._id,
    });
  } catch (error: any) {
    console.error('Error triggering regeneration:', error);
    res.status(500).json({ error: 'Failed to trigger regeneration' });
  }
});

/**
 * @route   POST /api/assignments/:id/apply-changes
 * @desc    Apply user feedback to an assignment and regenerate
 */
router.post('/:id/apply-changes', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { feedback } = req.body;
    const assignment = await Assignment.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (!feedback) {
      res.status(400).json({ error: 'Feedback is required' });
      return;
    }

    // Append feedback to instructions
    const existingInstructions = assignment.additionalInstructions || '';
    assignment.additionalInstructions = existingInstructions 
      ? existingInstructions + '\n\nUSER FEEDBACK FOR REVISION:\n' + feedback
      : 'USER FEEDBACK FOR REVISION:\n' + feedback;

    assignment.status = 'PENDING';
    assignment.progress = 0;
    assignment.error = undefined;
    // We intentionally DO NOT reset assignment.sections or assignment.answerKey here,
    // so the aiService can see the current paper and selectively refine it!
    await assignment.save();

    // Invalidate Redis PDF Cache
    await redisClient.del(`pdf:${req.params.id}`).catch(err => {
      console.error('Failed to invalidate Redis cache during apply-changes:', err);
    });

    await addAssignmentGenerationJob(assignment._id.toString());

    res.json({
      message: 'Revision started based on feedback.',
      assignmentId: assignment._id,
    });
  } catch (error: any) {
    console.error('Error triggering revision:', error);
    res.status(500).json({ error: 'Failed to trigger revision' });
  }
});

/**
 * @route   GET /api/assignments/:id/pdf
 * @desc    Download generated assignment sheet as formatted PDF
 */
router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (assignment.status !== 'COMPLETED') {
      res.status(400).json({ error: `Cannot download PDF. Assignment is currently ${assignment.status}. Please wait for it to complete generation.` });
      return;
    }

    const cacheKey = `pdf:${id}`;

    // 1. Try to read PDF buffer from Redis cache (Bonus Feature)
    const cachedBuffer = await redisClient.getBuffer(cacheKey).catch(() => null);

    const safeTitle = assignment.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${safeTitle}-Assignment.pdf`;

    if (cachedBuffer) {
      console.log(`Redis Cache Hit: Serving cached PDF for Assignment ${id}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(cachedBuffer);
      return;
    }

    // 2. Cache Miss: Generate PDF
    console.log(`Redis Cache Miss: Rendering new PDF for Assignment ${id}`);
    const pdfBuffer = await generateAssignmentPDFBuffer(assignment);

    // 3. Cache PDF buffer in Redis for 24 hours (86400 seconds)
    await redisClient.setex(cacheKey, 86400, pdfBuffer).catch(err => {
      console.error('Failed to save PDF in Redis Cache:', err);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating assignment PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
});

/**
 * @route   POST /api/assignments/:id/generate-sync
 * @desc    Manually run generation synchronously (bypassing BullMQ)
 */
router.post('/:id/generate-sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Run synchronously in background promise
    runSyncGeneration(id);

    res.json({
      message: 'Synchronous generation started.',
      assignmentId: id,
    });
  } catch (error: any) {
    console.error('Error triggering sync generation:', error);
    res.status(500).json({ error: 'Failed to start sync generation.' });
  }
});

/**
 * Helper function to run the generation synchronously.
 * Decouples processing from Redis/BullMQ in case Redis is offline.
 */
export const runSyncGeneration = async (assignmentId: string): Promise<void> => {
  console.log(`Running synchronous fallback generation for assignment: ${assignmentId}`);
  
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    console.error(`Sync Generation: Assignment not found: ${assignmentId}`);
    return;
  }

  try {
    assignment.status = 'PROCESSING';
    assignment.progress = 15;
    await assignment.save();
    emitAssignmentProgress(assignmentId, {
      status: 'PROCESSING',
      progress: 15,
      message: 'Sync Fallback: Initializing generation...',
    });

    // Parse uploaded file
    let referenceText = '';
    if (assignment.filePath) {
      const absolutePath = path.resolve(assignment.filePath);
      if (fs.existsSync(absolutePath)) {
        emitAssignmentProgress(assignmentId, {
          status: 'PROCESSING',
          progress: 30,
          message: 'Sync Fallback: Parsing uploaded document...',
        });

        if (absolutePath.toLowerCase().endsWith('.pdf')) {
          const fileBuffer = fs.readFileSync(absolutePath);
          const parsedPdf = await pdfParse(fileBuffer);
          referenceText = parsedPdf.text;
        } else {
          referenceText = fs.readFileSync(absolutePath, 'utf-8');
        }
      }
    }

    // Call AI multi-agent service
    const aiResult = await generateAssessmentPaper({
      title: assignment.title,
      className: assignment.className,
      subject: assignment.subject,
      questionTypes: assignment.questionTypes.map((qt: any) => ({
        type: qt.type,
        count: qt.count,
        marks: qt.marks,
      })),
      additionalInstructions: assignment.additionalInstructions,
      referenceText: referenceText || undefined,
      existingPaper: assignment.sections && assignment.sections.length > 0 && assignment.sections.some((s: any) => s.questions && s.questions.length > 0)
        ? { sections: assignment.sections, answerKey: assignment.answerKey }
        : undefined,
    }, (message, progress) => {
      // Forward progress events in real-time
      Assignment.updateOne(
        { _id: assignmentId },
        { $set: { status: 'PROCESSING', progress } }
      ).catch((err: any) => console.error('Error saving sync progression state:', err));

      emitAssignmentProgress(assignmentId, {
        status: 'PROCESSING',
        progress,
        message: `Sync Fallback: ${message}`,
      });
    });

    // Emit progress before saving generated data
    emitAssignmentProgress(assignmentId, {
      status: 'PROCESSING',
      progress: 95,
      message: 'Sync Fallback: Writing generated data to database...',
    });

    // Save generated sections and answer key
    assignment.sections = aiResult.sections;
    assignment.answerKey = aiResult.answerKey;
    // Preserve original subject, className, timeAllowed
    assignment.status = 'COMPLETED';
    assignment.progress = 100;
    await assignment.save();

    // Clear PDF cache
    await redisClient.del(`pdf:${assignmentId}`).catch(() => {});

    emitAssignmentProgress(assignmentId, {
      status: 'COMPLETED',
      progress: 100,
      message: 'Assessment paper successfully generated! (Sync fallback)',
    });

    console.log(`Sync Fallback Generation completed successfully: ${assignmentId}`);
  } catch (err: any) {
    console.error(`Sync Fallback Generation failed for ${assignmentId}:`, err);
    
    assignment.status = 'FAILED';
    assignment.progress = 100;
    assignment.error = err.message || 'Sync generation failed';
    await assignment.save();

    emitAssignmentProgress(assignmentId, {
      status: 'FAILED',
      progress: 100,
      error: err.message || 'Sync generation failed',
    });
  }
};

/**
 * @route   POST /api/assignments/upload-share
 * @desc    Upload an assignment / resource PDF to share with students
 */
router.post('/upload-share', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded or file format not supported.' });
      return;
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.status(201).json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error('Error uploading shared resource:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file.' });
  }
});

export default router;
