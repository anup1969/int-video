/**
 * PMS Webhook Endpoint
 * Receives notifications from PMS when version status changes
 *
 * Events:
 * - version_approved: Tester approved the version
 * - rebuild_requested: Tester found issues and requested a rebuild
 * - test: Test webhook connectivity
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

  try {
    const payload = req.body;

    console.log('='.repeat(50));
    console.log('PMS WEBHOOK RECEIVED');
    console.log('='.repeat(50));
    console.log('Event:', payload.event);
    console.log('Project:', payload.project_name);
    console.log('Version:', payload.version_number);

    // Build data object for storage
    let notificationData = {};

    if (payload.event === 'rebuild_requested') {
      console.log('\n*** REBUILD REQUESTED ***');
      console.log('Notes:', payload.rebuild_notes);
      console.log('Requested by:', payload.requested_by);
      console.log('\nTest Summary:');
      console.log('  Total:', payload.test_summary?.total);
      console.log('  Passing:', payload.test_summary?.passing);
      console.log('  Failing:', payload.test_summary?.failing);

      if (payload.failing_tests?.length > 0) {
        console.log('\nFailing Tests:');
        payload.failing_tests.forEach((test, i) => {
          console.log(`\n${i + 1}. ${test.title}`);
          console.log('   Status:', test.status);
          console.log('   Notes:', test.tester_notes || 'None');
          if (test.attachments?.length > 0) {
            console.log('   Attachments:', test.attachments);
          }
        });
      }

      console.log('\nPMS URL:', payload.pms_url);

      notificationData = {
        rebuild_notes: payload.rebuild_notes,
        requested_by: payload.requested_by,
        test_summary: payload.test_summary,
        failing_tests: payload.failing_tests,
        pms_url: payload.pms_url
      };
    }

    if (payload.event === 'version_approved') {
      console.log('\n*** VERSION APPROVED ***');
      console.log('Approved by:', payload.approved_by);

      notificationData = {
        approved_by: payload.approved_by,
        test_results: payload.test_results || [],
        pms_url: payload.pms_url
      };

      // Update version status to stable
      const { error: updateError } = await supabase
        .from('versions')
        .update({ status: 'stable' })
        .eq('version_number', payload.version_number);

      if (updateError) {
        console.error('Failed to update version status:', updateError);
      } else {
        console.log(`Version ${payload.version_number} marked as stable`);
      }
    }

    if (payload.event === 'test') {
      console.log('\n*** TEST WEBHOOK ***');
      console.log('Message:', payload.message);

      notificationData = {
        message: payload.message
      };
    }

    console.log('='.repeat(50));

    // Save notification to database
    const { error: insertError } = await supabase
      .from('pms_notifications')
      .insert({
        version_number: payload.version_number || 'test',
        pms_version_id: payload.version_id,
        event: payload.event,
        status: payload.event === 'version_approved' ? 'approved' :
                payload.event === 'rebuild_requested' ? 'rebuild_requested' : payload.event,
        data: notificationData
      });

    if (insertError) {
      console.error('Failed to save notification:', insertError);
    } else {
      console.log('Notification saved to database');
    }

    return res.status(200).json({
      received: true,
      event: payload.event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Invalid payload' });
  }
}
