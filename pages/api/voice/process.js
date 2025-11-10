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

    const prompt = `You are Jarvis, a voice assistant for an interactive video campaign platform. This platform allows users to create video campaigns with interactive steps where viewers can respond.

PLATFORM OVERVIEW:
- This is an interactive video campaign builder
- A "campaign" is a video-based survey/questionnaire with multiple interactive steps
- Each campaign can have different types of steps: open-ended questions, multiple-choice, buttons, contact forms, NPS ratings, file uploads, and text displays
- Users create campaigns, share them via URL, and collect video responses from participants
- Campaigns can be in different states: active, paused, or archived
- The platform has a dashboard showing all campaigns, a responses page for viewing submissions, and a builder for creating/editing campaigns

UNDERSTANDING USER INTENT:
- "Create a campaign/video/survey/questionnaire" = CREATE_CAMPAIGN
- "Go to/open/show dashboard/home/campaigns" = GO_TO_DASHBOARD
- "Go to/open/show responses/answers/submissions/results" = GO_TO_RESPONSES
- "Go to/open/show profile/settings/account" = GO_TO_PROFILE
- "Delete/remove campaign" = DELETE_CAMPAIGN
- "Copy/duplicate campaign" = DUPLICATE_CAMPAIGN
- "Activate/start/enable/publish campaign" = ACTIVATE_CAMPAIGN
- "Pause/stop/disable campaign" = PAUSE_CAMPAIGN
- "Archive campaign" = ARCHIVE_CAMPAIGN
- "Copy URL/link/share link" = COPY_URL
- "Add step/question/screen" = ADD_STEP
- "Save campaign/changes" = SAVE_CAMPAIGN
- "Log out/sign out/exit" = LOGOUT
- "Help/what can you do" = SHOW_HELP

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
- "make a new video survey" → {"action": "CREATE_CAMPAIGN", "params": {}, "feedback": "Creating new campaign..."}
- "go to dashboard" / "show me the dashboard" / "open dashboard" → {"action": "GO_TO_DASHBOARD", "params": {}, "feedback": "Opening dashboard..."}
- "show me the responses" / "view submissions" / "check answers" → {"action": "GO_TO_RESPONSES", "params": {}, "feedback": "Opening responses page..."}
- "go to my profile" / "open settings" / "show my account" → {"action": "GO_TO_PROFILE", "params": {}, "feedback": "Opening profile..."}
- "delete my campaign" → {"action": "DELETE_CAMPAIGN", "params": {}, "feedback": "Which campaign would you like to delete? Please say the campaign name."}
- "delete Marketing Q1" / "remove the Marketing Q1 campaign" → {"action": "DELETE_CAMPAIGN", "params": {"campaignName": "Marketing Q1"}, "feedback": "Are you sure you want to delete 'Marketing Q1'? Say 'yes' to confirm."}
- "activate my latest campaign" / "publish campaign" / "start the campaign" → {"action": "ACTIVATE_CAMPAIGN", "params": {"campaignName": "latest"}, "feedback": "Activating your latest campaign..."}
- "pause the campaign" / "stop my campaign" → {"action": "PAUSE_CAMPAIGN", "params": {}, "feedback": "Pausing campaign..."}
- "copy campaign" / "duplicate this campaign" → {"action": "DUPLICATE_CAMPAIGN", "params": {}, "feedback": "Duplicating campaign..."}
- "what can you do" / "help me" / "show commands" → {"action": "SHOW_HELP", "params": {}, "feedback": "I can help you create campaigns, navigate between pages, manage campaign status, and more. Just tell me what you need!"}
- "log me out" / "sign out" → {"action": "LOGOUT", "params": {}, "feedback": "Logging out..."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Remove markdown code block if present
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }

    console.log('[Voice API] Gemini raw response:', text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('[Voice API] JSON parse error:', parseError);
      console.error('[Voice API] Failed to parse text:', text);
      return res.status(500).json({
        action: 'UNKNOWN',
        params: {},
        feedback: 'Sorry, I had trouble understanding that command.'
      });
    }

    console.log('[Voice API] Parsed successfully:', parsed);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('[Voice API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      action: 'UNKNOWN',
      params: {},
      feedback: 'Sorry, I had trouble understanding that command.'
    });
  }
}
