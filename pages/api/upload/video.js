// API route for video upload to Supabase Storage
import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse form data
    const form = formidable({ multiples: false })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err)
        return res.status(500).json({ error: 'Failed to parse form data' })
      }

      const videoFile = files.video
      if (!videoFile) {
        return res.status(400).json({ error: 'No video file provided' })
      }

      try {
        // Read file
        const fileBuffer = fs.readFileSync(videoFile.filepath)
        const fileName = `${Date.now()}-${videoFile.originalFilename}`
        const filePath = `videos/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('videos')
          .upload(filePath, fileBuffer, {
            contentType: videoFile.mimetype,
            upsert: false,
          })

        if (error) {
          console.error('Supabase storage error:', error)
          return res.status(500).json({ error: error.message })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath)

        return res.status(200).json({
          success: true,
          url: urlData.publicUrl,
          fileName: fileName,
        })
      } catch (uploadError) {
        console.error('Upload error:', uploadError)
        return res.status(500).json({ error: 'Failed to upload video' })
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ error: error.message })
  }
}
