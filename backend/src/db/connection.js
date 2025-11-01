import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create table
pool.query(`
  CREATE TABLE IF NOT EXISTS scraping_tasks (
    id SERIAL PRIMARY KEY,
    website_url VARCHAR(500) NOT NULL,
    user_question TEXT NOT NULL,
    scraped_content TEXT,
    ai_answer TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.log('Table already exists or error:', err.message));

export default pool;
