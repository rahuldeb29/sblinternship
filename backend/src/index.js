import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './routes/tasks.js';
import { initializeDatabase } from './db/init.js';

// Initialize database
await initializeDatabase();

import './workers/scrapingWorker.js'; // Start worker

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', tasksRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server running!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
