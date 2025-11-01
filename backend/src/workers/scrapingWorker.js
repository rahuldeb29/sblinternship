import pool from '../db/connection.js';
import { scrapeWebsite } from '../services/scraper.js';
import { getAIAnswer } from '../services/aiService.js';

// Simple job processor
async function processJob(taskId) {
  console.log(`\n🔄 Processing task ${taskId}...`);
  
  try {
    const taskResult = await pool.query(
      'SELECT * FROM scraping_tasks WHERE id = $1',
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      throw new Error('Task not found');
    }
    
    const task = taskResult.rows[0];
    
    await pool.query(
      'UPDATE scraping_tasks SET status = $1 WHERE id = $2',
      ['processing', taskId]
    );
    
    console.log(`📄 Scraping ${task.website_url}...`);
    const scrapedContent = await scrapeWebsite(task.website_url);
    
    console.log('🤖 Getting AI answer...');
    const aiAnswer = await getAIAnswer(scrapedContent, task.user_question);
    
    await pool.query(
      'UPDATE scraping_tasks SET scraped_content = $1, ai_answer = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [scrapedContent, aiAnswer, 'completed', taskId]
    );
    
    console.log(`✅ Task ${taskId} completed!\n`);
  } catch (error) {
    console.error(`❌ Error processing task ${taskId}:`, error.message);
    
    await pool.query(
      'UPDATE scraping_tasks SET status = $1 WHERE id = $2',
      ['failed', taskId]
    );
  }
}

// Check for pending tasks every 5 seconds
setInterval(async () => {
  try {
    const result = await pool.query(
      'SELECT id FROM scraping_tasks WHERE status = $1 LIMIT 1',
      ['pending']
    );
    
    if (result.rows.length > 0) {
      const taskId = result.rows[0].id;
      await processJob(taskId);
    }
  } catch (error) {
    console.error('Worker error:', error.message);
  }
}, 5000);

console.log('🚀 Scraping worker started and listening for jobs...');
