import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate a random 6-character alphanumeric code
function generateShortCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if campaign already has a short URL
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('short_url')
      .eq('id', id)
      .single();

    if (existingCampaign?.short_url) {
      return res.status(200).json({
        shortUrl: existingCampaign.short_url,
        message: 'Campaign already has a short URL'
      });
    }

    // Generate a unique short code
    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      shortCode = generateShortCode();

      // Check if this code is already in use
      const { data: existing } = await supabase
        .from('campaigns')
        .select('id')
        .eq('short_url', shortCode)
        .single();

      if (!existing) {
        break; // Code is unique
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Failed to generate unique short URL' });
    }

    // Update campaign with short URL
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ short_url: shortCode })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return res.status(500).json({ error: 'Failed to generate short URL' });
    }

    return res.status(200).json({ shortUrl: shortCode });
  } catch (error) {
    console.error('Error generating short URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
