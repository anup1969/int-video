const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyAFN073qBM-3PrO13NxQdfvKDhu3pltrUw';

async function testGemini() {
  try {
    console.log('[Test] Testing new API key...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Say "Hello from Jarvis!"');
    const response = await result.response;
    const text = response.text();

    console.log('[Test] ✅ SUCCESS! Gemini is working!');
    console.log('[Test] Response:', text);
  } catch (error) {
    console.error('[Test] ❌ ERROR:', error.message);
  }
}

testGemini();
