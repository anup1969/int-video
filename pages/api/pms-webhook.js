/**
 * PMS Webhook Endpoint
 * Receives notifications from PMS when version status changes
 *
 * Events:
 * - version_approved: Tester approved the version
 * - rebuild_requested: Tester found issues and requested a rebuild
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.PMS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, version_number, version_id, data } = req.body;

  console.log(`[PMS Webhook] Received event: ${event} for version ${version_number}`);

  try {
    // Save notification to database
    const { error: insertError } = await supabase
      .from('pms_notifications')
      .insert({
        version_number,
        pms_version_id: version_id,
        event,
        status: event === 'version_approved' ? 'approved' :
                event === 'rebuild_requested' ? 'rebuild_requested' : event,
        data: data || {}
      });

    if (insertError) {
      console.error('[PMS Webhook] Failed to save notification:', insertError);
    } else {
      console.log('[PMS Webhook] Notification saved to database');
    }

    // Also update the local version status if approved
    if (event === 'version_approved') {
      const { error: updateError } = await supabase
        .from('versions')
        .update({ status: 'stable' })
        .eq('version_number', version_number);

      if (updateError) {
        console.error('[PMS Webhook] Failed to update version status:', updateError);
      } else {
        console.log(`[PMS Webhook] Version ${version_number} marked as stable`);
      }
    }

  } catch (error) {
    console.error('[PMS Webhook] Error:', error);
  }

  return res.status(200).json({
    received: true,
    event,
    version_number,
    timestamp: new Date().toISOString()
  });
}
