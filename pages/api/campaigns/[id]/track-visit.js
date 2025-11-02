import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a hash of IP + User Agent for unique visitor tracking
function createVisitorId(ip, userAgent) {
  const combined = `${ip}-${userAgent}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get visitor info
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const visitorId = createVisitorId(ip, userAgent);

    // Get campaign info
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('usage_limit, usage_count')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if limit already reached
    if (campaign.usage_limit && campaign.usage_count >= campaign.usage_limit) {
      return res.status(200).json({
        limitReached: true,
        usageCount: campaign.usage_count,
        usageLimit: campaign.usage_limit
      });
    }

    // Try to insert visit (will fail silently if already exists due to UNIQUE constraint)
    const { error: visitError } = await supabase
      .from('campaign_visits')
      .insert([
        {
          campaign_id: id,
          visitor_id: visitorId
        }
      ]);

    // If insert successful (new visitor), increment usage_count
    if (!visitError) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          usage_count: (campaign.usage_count || 0) + 1
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating usage count:', updateError);
      }

      const newCount = (campaign.usage_count || 0) + 1;
      const limitReached = campaign.usage_limit && newCount >= campaign.usage_limit;

      return res.status(200).json({
        tracked: true,
        limitReached,
        usageCount: newCount,
        usageLimit: campaign.usage_limit
      });
    }

    // Visit already exists (returning visitor), don't increment
    return res.status(200).json({
      tracked: false,
      limitReached: false,
      usageCount: campaign.usage_count,
      usageLimit: campaign.usage_limit,
      message: 'Returning visitor (not counted)'
    });

  } catch (error) {
    console.error('Error tracking visit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
