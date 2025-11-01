export const scrapingTasks = {
  id: 'SERIAL PRIMARY KEY',
  websiteUrl: 'VARCHAR(500) NOT NULL',
  userQuestion: 'TEXT NOT NULL',
  scrapedContent: 'TEXT',
  aiAnswer: 'TEXT',
  status: 'VARCHAR(20) NOT NULL DEFAULT \'pending\'',
  createdAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  updatedAt: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
};
