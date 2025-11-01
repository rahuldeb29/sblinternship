import pool from './connection.js';

export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scraping_tasks (
        id SERIAL PRIMARY KEY,
        website_url VARCHAR(500) NOT NULL,
        user_question TEXT NOT NULL,
        scraped_content TEXT,
        ai_answer TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database init error:', error);
  }
}
