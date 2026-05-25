import { Router, Request, Response } from 'express';
import SavedQuestion from '../models/SavedQuestion';
import { protect } from '../middleware/authMiddleware';
import LibraryDocument from '../models/LibraryDocument';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// Get all saved questions for logged in user
router.get('/', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const questions = await SavedQuestion.find({ user: userId }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save a new question to the library
router.post('/', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { questionText, difficulty, marks, svgDiagram, answerText, subject, topic } = req.body;

    if (!questionText || !difficulty || !marks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const savedQuestion = new SavedQuestion({
      user: userId,
      questionText,
      difficulty,
      marks,
      svgDiagram,
      answerText,
      subject,
      topic
    });

    await savedQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a question from library
router.delete('/:id', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const questionId = req.params.id;
    
    const question = await SavedQuestion.findOneAndDelete({ _id: questionId, user: userId });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json({ message: 'Question removed from library' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// DOCUMENTS MANAGEMENT
// =======================

// Get all saved documents
router.get('/documents', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const docs = await LibraryDocument.find({ user: userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload new documents
router.post('/documents', protect, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    const uploadedDocs = [];

    for (const file of files) {
      const doc = new LibraryDocument({
        user: userId,
        fileName: file.filename,
        originalFileName: file.originalname,
        fileSize: file.size,
      });
      await doc.save();
      uploadedDocs.push(doc);
    }

    res.status(201).json(uploadedDocs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a document
router.delete('/documents/:id', protect, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const docId = req.params.id;

    const doc = await LibraryDocument.findOneAndDelete({ _id: docId, user: userId });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Try deleting physical file
    try {
      const filePath = path.join(process.cwd(), 'uploads', doc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to delete physical file, but document reference was removed.');
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
