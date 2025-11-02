import express from 'express';
import pool from '../db/connection.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();
const client = new Anthropic();

// Function to scrape website content
async function scrapeWebsite(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove script and style tags
    $('script').remove();
    $('style').remove();
    
    // Get text content
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000); // Limit to 4000 chars
    
    return text;
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

// Function to get AI response
async function getAIResponse(scrapedContent, userQuestion) {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Based on the following website content, please answer this question: "${userQuestion}"\n\nWebsite Content:\n${scrapedContent}`
        }
      ]
    });
    
    return message.content[0].type === 'text' ? message.content[0].text : 'No response generated';
  } catch (error) {
    console.error('AI error:', error.message);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Submit endpoint
router.post('/submit', async (req, res) => {
  try {
    const { websiteUrl, userQuestion } = req.body;
    
    if (!websiteUrl || !userQuestion) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert into database with pending status
    const result = await pool.query(
      'INSERT INTO scraping_tasks (website_url, user_question, status) VALUES ($1, $2, $3) RETURNING id',
      [websiteUrl, userQuestion, 'pending']
    );
    
    const taskId = result.rows[0].id;
    
    // Process in background (don't wait for completion)
    processTask(taskId, websiteUrl, userQuestion);
    
    res.json({ success: true, taskId });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process task asynchronously
async function processTask(taskId, websiteUrl, userQuestion) {
  try {
    // Update status to processing
    await pool.query(
      'UPDATE scraping_tasks SET status = $1 WHERE id = $2',
      ['processing', taskId]
    );
    
    console.log(`Processing task ${taskId}...`);
    
    // Scrape the website
    const scrapedContent = await scrapeWebsite(websiteUrl);
    
    // Get AI response
    const aiAnswer = await getAIResponse(scrapedContent, userQuestion);
    
    // Update database with completed status
    await pool.query(
      'UPDATE scraping_tasks SET status = $1, scraped_content = $2, ai_answer = $3, updated_at = NOW() WHERE id = $4',
      ['completed', scrapedContent, aiAnswer, taskId]
    );
    
    console.log(`✅ Task ${taskId} completed successfully`);
  } catch (error) {
    console.error(`❌ Task ${taskId} failed:`, error.message);
    
    // Update database with failed status
    await pool.query(
      'UPDATE scraping_tasks SET status = $1, ai_answer = $2, updated_at = NOW() WHERE id = $3',
      ['failed', `Error: ${error.message}`, taskId]
    ).catch(err => console.error('Database update error:', err));
  }
}

// Get task endpoint
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
