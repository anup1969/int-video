// API route for video upload to Supabase Storage
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
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
    // Get content type
    const contentType = req.headers['content-type'] || ''

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type. Expected multipart/form-data' })
    }

    // Parse multipart form data manually
    const boundary = contentType.split('boundary=')[1]
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in multipart data' })
    }

    // Collect request body
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Parse multipart data
    const boundaryBuffer = Buffer.from(`--${boundary}`)
    const parts = []
    let start = 0

    while (start < buffer.length) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer, start)
      if (boundaryIndex === -1) break

      const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length)
      if (nextBoundaryIndex === -1) break

      const part = buffer.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex)
      parts.push(part)
      start = nextBoundaryIndex
    }

    // Find the video file part
    let videoBuffer = null
    let fileName = 'video.mp4'
    let mimeType = 'video/mp4'

    for (const part of parts) {
      const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
      if (headerEnd === -1) continue

      const headers = part.slice(0, headerEnd).toString()
      const body = part.slice(headerEnd + 4, part.length - 2) // Remove trailing \r\n

      // Check if this is the video file
      if (headers.includes('name="video"') && headers.includes('filename=')) {
        const fileNameMatch = headers.match(/filename="([^"]+)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }

        const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)
        if (contentTypeMatch) {
          mimeType = contentTypeMatch[1].trim()
        }

        videoBuffer = body
        break
      }
    }

    if (!videoBuffer || videoBuffer.length === 0) {
      return res.status(400).json({ error: 'No video file found in request' })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${fileName}`
    const filePath = `videos/${uniqueFileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, videoBuffer, {
        contentType: mimeType,
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
      fileName: uniqueFileName,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: error.message || 'Failed to upload video' })
  }
}
