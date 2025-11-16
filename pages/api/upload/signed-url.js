import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = fileName.split('.').pop();
    const filePath = `audio/${timestamp}-${randomStr}.${ext}`;

    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('campaign-files')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('Signed URL error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL for after upload
    const { data: urlData } = supabase.storage
      .from('campaign-files')
      .getPublicUrl(filePath);

    return res.status(200).json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
