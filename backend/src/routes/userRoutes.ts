import express, { Request, Response } from 'express';
import User from '../models/User';

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Create or login a user
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, schoolName, schoolCity } = req.body;

    if (!name || !email || !schoolName || !schoolCity) {
      res.status(400).json({ error: 'All fields (name, email, schoolName, schoolCity) are required.' });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      console.log(`User already exists. Logging in: ${email}`);
      res.json(user);
      return;
    }

    // Create new user
    user = new User({
      name,
      email: email.toLowerCase(),
      schoolName,
      schoolCity
    });

    await user.save();
    console.log(`New user registered: ${email}`);
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: error.message || 'Failed to create account.' });
  }
});

/**
 * @route   GET /api/users/:email
 * @desc    Get user details by email
 */
router.get('/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user details.' });
  }
});

/**
 * @route   PUT /api/users/:email
 * @desc    Update user details
 */
router.put('/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, schoolName, schoolCity } = req.body;

    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (name) user.name = name;
    if (schoolName) user.schoolName = schoolName;
    if (schoolCity) user.schoolCity = schoolCity;

    await user.save();
    console.log(`User settings updated: ${user.email}`);
    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;

