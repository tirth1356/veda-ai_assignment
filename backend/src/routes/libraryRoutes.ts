import { Router, Request, Response } from 'express';
import SavedQuestion from '../models/SavedQuestion';
import { protect } from '../middleware/authMiddleware';

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

export default router;
