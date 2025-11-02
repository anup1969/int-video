import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { shortUrl } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Look up campaign by short URL
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('id')
      .eq('short_url', shortUrl)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    return res.status(200).json({ campaignId: campaign.id });
  } catch (error) {
    console.error('Error looking up short URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
