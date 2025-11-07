import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all ad-hoc reports, optionally filtered by version
    const { version_id, status } = req.query;

    try {
      let query = supabase
        .from('ad_hoc_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (version_id) {
        query = query.eq('version_id', version_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error fetching ad-hoc reports:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    // Create new ad-hoc report
    const {
      version_id,
      report_type,
      title,
      description,
      severity,
      steps_to_reproduce,
      tester_name,
      browser,
      device,
      screenshots = []
    } = req.body;

    // Validate required fields
    if (!version_id || !report_type || !title || !description || !tester_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: version_id, report_type, title, description, tester_name'
      });
    }

    // Validate report_type
    if (!['bug', 'suggestion', 'improvement'].includes(report_type)) {
      return res.status(400).json({
        success: false,
        error: 'report_type must be one of: bug, suggestion, improvement'
      });
    }

    // Validate severity if provided
    if (severity && !['critical', 'high', 'medium', 'low'].includes(severity)) {
      return res.status(400).json({
        success: false,
        error: 'severity must be one of: critical, high, medium, low'
      });
    }

    try {
      const { data, error } = await supabase
        .from('ad_hoc_reports')
        .insert({
          version_id,
          report_type,
          title,
          description,
          severity: severity || null,
          steps_to_reproduce: steps_to_reproduce || null,
          tester_name,
          browser,
          device,
          screenshots,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      console.error('Error creating ad-hoc report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PATCH') {
    // Update ad-hoc report (for status updates, developer notes)
    const { id, status, developer_notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: id'
      });
    }

    // Validate status if provided
    if (status && !['open', 'in_progress', 'resolved', 'wont_fix'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: open, in_progress, resolved, wont_fix'
      });
    }

    try {
      const updateData = { updated_at: new Date().toISOString() };
      if (status) updateData.status = status;
      if (developer_notes !== undefined) updateData.developer_notes = developer_notes;

      const { data, error } = await supabase
        .from('ad_hoc_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error updating ad-hoc report:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
