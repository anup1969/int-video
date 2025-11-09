// API route for processing voice commands with Google Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('[Voice API] GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'Voice assistant not configured. Please add GEMINI_API_KEY to environment variables.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a voice assistant for a campaign management application. Analyze the user's voice command and return ONLY a JSON object with the action to perform.

Available actions:
- CREATE_CAMPAIGN: Create a new campaign (params: name)
- GO_TO_DASHBOARD: Navigate to dashboard
- GO_TO_RESPONSES: Navigate to responses page
- GO_TO_PROFILE: Navigate to profile page
- DELETE_CAMPAIGN: Delete a campaign (params: campaignName - extract from command)
- DUPLICATE_CAMPAIGN: Duplicate a campaign (params: campaignName)
- ACTIVATE_CAMPAIGN: Activate a campaign (params: campaignName)
- PAUSE_CAMPAIGN: Pause a campaign (params: campaignName)
- ARCHIVE_CAMPAIGN: Archive a campaign (params: campaignName)
- COPY_URL: Copy campaign URL to clipboard (params: campaignName)
- ADD_STEP: Add a step in builder (params: stepType - one of: open-ended, multiple-choice, button, contact-form, nps, file-upload, text)
- SAVE_CAMPAIGN: Save current campaign
- LOGOUT: Log out user
- SHOW_HELP: Show available commands
- UNKNOWN: Command not recognized

User command: "${command}"

Return ONLY valid JSON in this exact format:
{
  "action": "ACTION_NAME",
  "params": {},
  "feedback": "User-friendly message to show"
}

Examples:
- "create a new campaign called Marketing Q1" → {"action": "CREATE_CAMPAIGN", "params": {"name": "Marketing Q1"}, "feedback": "Creating campaign 'Marketing Q1'..."}
- "go to dashboard" → {"action": "GO_TO_DASHBOARD", "params": {}, "feedback": "Opening dashboard..."}
- "delete my campaign" → {"action": "DELETE_CAMPAIGN", "params": {}, "feedback": "Which campaign would you like to delete? Please say the campaign name."}
- "delete Marketing Q1" → {"action": "DELETE_CAMPAIGN", "params": {"campaignName": "Marketing Q1"}, "feedback": "Are you sure you want to delete 'Marketing Q1'? Say 'yes' to confirm."}
- "activate my latest campaign" → {"action": "ACTIVATE_CAMPAIGN", "params": {"campaignName": "latest"}, "feedback": "Activating your latest campaign..."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code block if present
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }

    console.log('[Voice API] Gemini response:', text);

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('[Voice API] Error:', error);
    return res.status(500).json({
      action: 'UNKNOWN',
      params: {},
      feedback: 'Sorry, I had trouble understanding that command.'
    });
  }
}
