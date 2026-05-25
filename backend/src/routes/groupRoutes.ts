import { Router, Request, Response } from 'express';
import Group from '../models/Group';
import Assignment from '../models/Assignment';
import { protect } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);


/**
 * @route   POST /api/groups
 * @desc    Create a new group
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, className, subject } = req.body;
    if (!name || !className || !subject) {
      res.status(400).json({ error: 'Name, className, and subject are required.' });
      return;
    }

    const newGroup = new Group({
      user: (req as any).user.id,
      name,
      className,
      subject,
      assignments: []
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

/**
 * @route   GET /api/groups
 * @desc    Get all groups
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // We populate assignments to get the count or details if needed
    const groups = await Group.find({ user: (req as any).user.id })
      .populate('assignments', 'title _id status')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups.' });
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    Get specific group with full populated assignments
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await Group.findOne({ _id: req.params.id, user: (req as any).user.id })
      .populate('assignments', 'title subject className status createdAt totalMarks totalQuestions difficulty');
    if (!group) {
      res.status(404).json({ error: 'Group not found or unauthorized.' });
      return;
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Failed to fetch group details.' });
  }
});

/**
 * @route   POST /api/groups/:id/assignments
 * @desc    Add an assignment to a group
 */
router.post('/:id/assignments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) {
      res.status(400).json({ error: 'assignmentId is required.' });
      return;
    }

    const group = await Group.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!group) {
      res.status(404).json({ error: 'Group not found or unauthorized.' });
      return;
    }

    // Check if assignment exists
    const assignmentExists = await Assignment.findById(assignmentId);
    if (!assignmentExists) {
      res.status(404).json({ error: 'Assignment not found in database.' });
      return;
    }

    // Avoid duplicates
    if (!group.assignments.includes(assignmentId)) {
      group.assignments.push(assignmentId);
      await group.save();
    }

    res.json(group);
  } catch (error) {
    console.error('Error adding assignment to group:', error);
    res.status(500).json({ error: 'Failed to add assignment to group.' });
  }
});

/**
 * @route   DELETE /api/groups/:id/assignments/:assignmentId
 * @desc    Remove an assignment from a group
 */
router.delete('/:id/assignments/:assignmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await Group.findOne({ _id: req.params.id, user: (req as any).user.id });
    if (!group) {
      res.status(404).json({ error: 'Group not found or unauthorized.' });
      return;
    }

    group.assignments = group.assignments.filter(id => id.toString() !== req.params.assignmentId);
    await group.save();

    res.json(group);
  } catch (error) {
    console.error('Error removing assignment from group:', error);
    res.status(500).json({ error: 'Failed to remove assignment from group.' });
  }
});

export default router;
