import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeWebsite(url) {
  try {
    console.log(`Scraping ${url}...`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    
    $('script, style').remove();
    
    const textContent = $('body').text().trim().replace(/\s+/g, ' ');
    
    return textContent.substring(0, 5000);
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw new Error(`Scraping failed: ${error.message}`);
  }
}
