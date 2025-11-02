import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

router.post('/submit', async (req, res) => {
  try {
    const { websiteUrl, userQuestion } = req.body;
    
    if (!websiteUrl || !userQuestion) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert into database
    const result = await pool.query(
      'INSERT INTO scraping_tasks (website_url, user_question, status) VALUES ($1, $2, $3) RETURNING id',
      [websiteUrl, userQuestion, 'pending']
    );
    
    const taskId = result.rows[0].id;
    
    // Simulate response (instead of actual scraping)
    setTimeout(async () => {
      await pool.query(
        'UPDATE scraping_tasks SET status = $1, ai_answer = $2 WHERE id = $3',
        ['completed', `This is a demo answer for: ${userQuestion}`, taskId]
      );
    }, 3000);
    
    res.json({ success: true, taskId });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/task/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const result = await pool.query(
      'SELECT * FROM scraping_tasks WHERE id = $1',
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
