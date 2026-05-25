import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import assignmentRoutes from './routes/assignmentRoutes';
import libraryRoutes from './routes/libraryRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Standard middleware
app.use(cors({
  origin: '*', // In production, refine to specific domains
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads static folder for reference
app.use('/uploads', express.static(path.resolve('uploads')));

import authRoutes from './routes/authRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/users', userRoutes);


// Simple healthcheck route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

export default app;
