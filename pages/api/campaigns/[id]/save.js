// API route to save entire campaign state (nodes, connections, settings)
import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { id } = req.query
  const { nodes, connections, settings } = req.body

  try {
    // 1. Update campaign settings
    const updateData = {
      name: settings?.name || 'Untitled Campaign',
      usage_limit: settings?.usageLimit || null,
      settings: settings || {},
    };

    // Add schedule fields if they exist
    if (settings?.scheduleStart !== undefined) {
      updateData.schedule_start = settings.scheduleStart;
    }
    if (settings?.scheduleEnd !== undefined) {
      updateData.schedule_end = settings.scheduleEnd;
    }
    // Add password field if it exists
    if (settings?.password !== undefined) {
      updateData.password = settings.password;
    }

    const { error: campaignError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)

    if (campaignError) throw campaignError

    // 2. Delete existing steps (cascade will delete connections)
    const { error: deleteStepsError } = await supabase
      .from('steps')
      .delete()
      .eq('campaign_id', id)

    if (deleteStepsError) throw deleteStepsError

    // 3. Insert new steps and create ID mapping
    // Store all node data in the 'data' JSONB column
    const videoNodes = nodes.filter(n => n.type === 'video');
    const videoSteps = videoNodes.map(node => ({
      campaign_id: id,
      step_number: node.stepNumber,
      label: node.label,
      answer_type: node.answerType || 'open-ended',
      data: {
        originalId: node.id, // Store frontend ID for mapping
        position: node.position,
        videoUrl: node.videoUrl || null,
        videoThumbnail: node.videoThumbnail || null,
        videoPlaceholder: node.videoPlaceholder || '🎬',
        mcOptions: node.mcOptions || [],
        buttonOptions: node.buttonOptions || [],
        buttonShowTime: node.buttonShowTime || 0,
        enabledResponseTypes: node.enabledResponseTypes || { video: true, audio: true, text: true },
        showContactForm: node.showContactForm || false,
        contactFormFields: node.contactFormFields || [],
        logicRules: node.logicRules || [],
        slideType: node.slideType || 'video',
        textContent: node.textContent || '',
        backgroundColor: node.backgroundColor || '',
        fontFamily: node.fontFamily || '',
      }
    }))

    let idMapping = {}; // Map frontend node IDs to database step IDs

    if (videoSteps.length > 0) {
      // Insert and get back the database-generated IDs
      const { data: insertedSteps, error: stepsError } = await supabase
        .from('steps')
        .insert(videoSteps)
        .select()

      if (stepsError) throw stepsError

      // Create mapping: frontend node ID -> database step ID
      insertedSteps.forEach(step => {
        idMapping[step.data.originalId] = step.id;
      });

      console.log('ID Mapping:', idMapping);
    }

    // 4. Insert connections using mapped database IDs
    const connectionsData = connections
      .filter(conn => {
        // Skip connections from 'start' node (can't be saved to database)
        if (conn.from === 'start') {
          return false;
        }

        // Only include connections where both nodes exist
        const fromExists = idMapping[conn.from];
        const toExists = idMapping[conn.to];

        if (!fromExists || !toExists) {
          console.warn('Skipping connection - missing nodes:', { from: conn.from, to: conn.to });
        }

        return fromExists && toExists;
      })
      .map(conn => ({
        campaign_id: id,
        from_step_id: idMapping[conn.from],
        to_step_id: idMapping[conn.to],
        connection_type: conn.type || 'logic',
      }))

    if (connectionsData.length > 0) {
      const { error: connectionsError } = await supabase
        .from('connections')
        .insert(connectionsData)

      if (connectionsError) throw connectionsError
    }

    return res.status(200).json({
      message: 'Campaign saved successfully',
      campaign_id: id,
    })
  } catch (error) {
    console.error('Error saving campaign:', error)
    return res.status(500).json({ error: error.message })
  }
}
