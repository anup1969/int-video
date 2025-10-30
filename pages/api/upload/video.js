// API route to generate signed upload URL for Supabase Storage
// This approach uploads directly from browser to Supabase, bypassing server
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileName, fileType } = req.body

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${fileName}`
    const filePath = `videos/${uniqueFileName}`

    // Create a signed upload URL (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Signed URL error:', error)
      return res.status(500).json({ error: error.message })
    }

    // Get the public URL for later use
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl: urlData.publicUrl,
      fileName: uniqueFileName,
    })

  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ error: error.message || 'Failed to generate upload URL' })
  }
}
