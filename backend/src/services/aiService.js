import axios from 'axios';

export async function getAIAnswer(scrapedContent, question) {
  try {
    console.log('Sending to Gemini AI...');
    
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY not found in .env file');
    }
    
    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    
    // Use v1beta API with gemini-2.5-flash model (correct for Nov 2025)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    console.log('Using Gemini 2.5 Flash model via v1beta API');
    
    // Limit content to 2000 characters to avoid token limits
    const prompt = `Based on the following website content, answer this question in details using simpler terms so that anyone can understand about the topic easily: "${question}"\n\nContent: ${scrapedContent.substring(0, 3000)}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    const answer = response.data.candidates[0].content.parts[0].text;
    console.log('✅ AI response received successfully');
    
    return answer;
  } catch (error) {
    console.error('AI Service error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw new Error(`AI API failed: ${error.message}`);
  }
}
