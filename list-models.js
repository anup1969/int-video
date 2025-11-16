const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyAFN073qBM-3PrO13NxQdfvKDhu3pltrUw';

async function listModels() {
  try {
    console.log('[Test] Listing available models...\n');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const models = await genAI.listModels();

    console.log('Available models:');
    models.forEach((model) => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });
  } catch (error) {
    console.error('[Test] ERROR:', error.message);
  }
}

listModels();
