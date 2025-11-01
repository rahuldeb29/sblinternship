'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

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
  const [taskId, setTaskId] = useState<number | null>(null);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: { websiteUrl: string; userQuestion: string }) => {
      const response = await axios.post(`${API_URL}/submit`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setTaskId(data.taskId);
      setWebsiteUrl('');
      setQuestion('');
    },
    onError: (error: any) => {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  });

  // Poll task status
  const { data: task, isLoading } = useQuery<TaskData>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/task/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
    refetchInterval: (data) => {
      if (!data) return 2000;
      return data.status === 'completed' || data.status === 'failed' 
        ? false 
        : 2000;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl || !question) {
      alert('Please fill all fields');
      return;
    }
    submitMutation.mutate({ websiteUrl, userQuestion: question });
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
            disabled={submitMutation.isPending}
            className={styles.button}
          >
            {submitMutation.isPending ? '⏳ Submitting...' : '✉️ Submit'}
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
                  onClick={() => setTaskId(null)}
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
