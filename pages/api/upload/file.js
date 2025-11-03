import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({});

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.originalFilename.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('campaign-files')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-files')
      .getPublicUrl(fileName);

    return res.status(200).json({
      success: true,
      fileName: file.originalFilename,
      fileSize: file.size,
      fileType: file.mimetype,
      fileUrl: urlData.publicUrl,
      storagePath: fileName
    });

  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'File upload failed', details: error.message });
  }
}
