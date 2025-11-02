'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://sbl-backend-c6i9.onrender.com').replace(/\/$/, '');

interface TaskData {
  id: number;
  website_url: string;
  user_question: string;
  scraped_content: string | null;
  ai_answer: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl || !question) {
      alert('Please fill all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${API_URL}/submit`, {
        websiteUrl,
        userQuestion: question
      });
      setTask(response.data);
      setWebsiteUrl('');
      setQuestion('');
      pollTaskStatus(response.data.id);
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const pollTaskStatus = async (taskId: number) => {
    setLoading(true);
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/task/${taskId}`);
        setTask(response.data);

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error polling task:', error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  };

  const resetForm = () => {
    setTask(null);
    setLoading(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>🔍 Website Scraper & AI Q&A</h1>
        <p className={styles.subtitle}>
          Enter a website URL and ask any question. Our AI will scrape the content and answer your question.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="url">Website URL:</label>
            <input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="question">Your Question:</label>
            <input
              id="question"
              type="text"
              placeholder="What is mentioned about..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className={styles.button}
          >
            {submitting ? '⏳ Submitting...' : '✉️ Submit'}
          </button>
        </form>

        {task && (
          <div className={`${styles.result} ${styles[task.status]}`}>
            <h2>Status: <span>{task.status.toUpperCase()}</span></h2>
            
            {task.status === 'pending' && (
              <p className={styles.statusMessage}>⏳ Your request is waiting in the queue...</p>
            )}
            
            {task.status === 'processing' && (
              <p className={styles.statusMessage}>🔄 Processing your request... This may take 1-2 minutes</p>
            )}
            
            {task.status === 'failed' && (
              <p className={styles.statusMessage}>❌ Failed to process your request. Please try again.</p>
            )}
            
            {task.status === 'completed' && (
              <div className={styles.answer}>
                <h3>✅ AI Answer:</h3>
                <div className={styles.answerContent}>
                  {task.ai_answer}
                </div>
                <button 
                  onClick={resetForm}
                  className={styles.resetButton}
                >
                  Ask Another Question
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
