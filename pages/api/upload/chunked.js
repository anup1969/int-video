import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Vercel limit
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chunk, fileName, chunkIndex, totalChunks, fileType } = req.body;

    if (!chunk || !fileName || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 chunk back to binary
    const chunkBuffer = Buffer.from(chunk, 'base64');

    // For first chunk, start a new upload
    if (chunkIndex === 0) {
      // Upload first chunk
      const { data, error } = await supabase.storage
        .from('campaign-files')
        .upload(fileName, chunkBuffer, {
          contentType: fileType,
          upsert: true // Allow overwriting for retries
        });

      if (error) {
        console.error('Supabase storage error (chunk 0):', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        chunkIndex,
        message: 'First chunk uploaded'
      });
    }

    // For subsequent chunks, append to existing file
    // Note: Supabase doesn't support append operations natively
    // We'll need to download, append, and re-upload

    // Get existing file
    const { data: existingFile, error: downloadError } = await supabase.storage
      .from('campaign-files')
      .download(fileName);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return res.status(500).json({ error: downloadError.message });
    }

    // Convert existing file to buffer
    const existingBuffer = Buffer.from(await existingFile.arrayBuffer());

    // Concatenate buffers
    const combinedBuffer = Buffer.concat([existingBuffer, chunkBuffer]);

    // Upload combined file
    const { data, error } = await supabase.storage
      .from('campaign-files')
      .upload(fileName, combinedBuffer, {
        contentType: fileType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage error (append):', error);
      return res.status(500).json({ error: error.message });
    }

    // If this is the last chunk, return the public URL
    if (chunkIndex === totalChunks - 1) {
      const { data: urlData } = supabase.storage
        .from('campaign-files')
        .getPublicUrl(fileName);

      return res.status(200).json({
        success: true,
        chunkIndex,
        completed: true,
        fileUrl: urlData.publicUrl,
        fileName: fileName,
        fileSize: combinedBuffer.length,
        fileType: fileType
      });
    }

    return res.status(200).json({
      success: true,
      chunkIndex,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded`
    });

  } catch (error) {
    console.error('Chunked upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
