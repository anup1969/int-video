/**
 * PMS Webhook Endpoint
 * Receives notifications from PMS when version status changes
 *
 * Events:
 * - version_approved: Tester approved the version
 * - rebuild_requested: Tester found issues and requested a rebuild
 */

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

  switch (event) {
    case 'version_approved':
      console.log(`[PMS] Version ${version_number} APPROVED!`);
      console.log(`[PMS] Test results:`, data?.test_results);
      // Could trigger deployment, send notification, update internal status, etc.
      break;

    case 'rebuild_requested':
      console.log(`[PMS] Version ${version_number} REBUILD REQUESTED`);
      console.log(`[PMS] Reason:`, data?.rebuild_notes);
      console.log(`[PMS] Failed tests:`, data?.failed_tests);
      // Could create GitHub issue, send alert, etc.
      break;

    default:
      console.log(`[PMS] Unknown event: ${event}`);
  }

  return res.status(200).json({
    received: true,
    event,
    version_number,
    timestamp: new Date().toISOString()
  });
}
