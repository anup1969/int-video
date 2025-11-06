// API endpoint to transcribe audio/video files using Hugging Face Whisper (Free & Open Source)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
  maxDuration: 300, // 5 minutes for transcription
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileUrl, responseId, stepId } = req.body;

    if (!fileUrl || !responseId || !stepId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Transcribing file:', fileUrl);

    // Download the file from Supabase Storage
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('File size:', buffer.length, 'bytes');

    // Use Hugging Face's free Whisper API (requires free API token)
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
    }

    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: buffer.toString('base64'),
        }),
      }
    );

    if (!hfResponse.ok) {
      const error = await hfResponse.text();
      console.error('Hugging Face API error:', error);
      console.error('Status:', hfResponse.status);
      throw new Error(`Transcription API error (${hfResponse.status}): ${error}`);
    }

    const result = await hfResponse.json();
    const transcription = result.text || result[0]?.text || 'No transcription available';

    // Update the response in database with transcription
    const { data: responseData, error: fetchError } = await supabase
      .from('responses')
      .select('data')
      .eq('id', responseId)
      .single();

    if (fetchError) {
      console.error('Error fetching response:', fetchError);
      throw new Error('Failed to fetch response');
    }

    // Add transcription to the specific step
    const updatedData = { ...responseData.data };
    const stepIndex = updatedData.steps?.findIndex(s => s.stepId === stepId);

    if (stepIndex !== -1) {
      updatedData.steps[stepIndex].transcription = transcription;
    }

    // Save back to database
    const { error: updateError } = await supabase
      .from('responses')
      .update({ data: updatedData })
      .eq('id', responseId);

    if (updateError) {
      console.error('Error updating response:', updateError);
      throw new Error('Failed to save transcription');
    }

    return res.status(200).json({
      success: true,
      transcription: transcription
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: error.message || 'Transcription failed',
      details: error.toString()
    });
  }
}
