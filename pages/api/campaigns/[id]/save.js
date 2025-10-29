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
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({
        name: settings?.name || 'Untitled Campaign',
        settings: settings || {},
      })
      .eq('id', id)

    if (campaignError) throw campaignError

    // 2. Delete existing steps (cascade will delete connections)
    const { error: deleteStepsError } = await supabase
      .from('steps')
      .delete()
      .eq('campaign_id', id)

    if (deleteStepsError) throw deleteStepsError

    // 3. Insert new steps (filter out 'start' node)
    const videoSteps = nodes.filter(n => n.type === 'video').map(node => ({
      campaign_id: id,
      id: node.id,
      step_number: node.stepNumber,
      label: node.label,
      position: node.position,
      answer_type: node.answerType,
      video_url: node.videoUrl || null,
      video_thumbnail: node.videoThumbnail || null,
      video_placeholder: node.videoPlaceholder || '🎬',
      mc_options: node.mcOptions || [],
      button_options: node.buttonOptions || [],
      enabled_response_types: node.enabledResponseTypes || { video: true, audio: true, text: true },
      show_contact_form: node.showContactForm || false,
      contact_form_fields: node.contactFormFields || [],
      logic_rules: node.logicRules || [],
    }))

    if (videoSteps.length > 0) {
      const { error: stepsError } = await supabase
        .from('steps')
        .insert(videoSteps)

      if (stepsError) throw stepsError
    }

    // 4. Insert connections
    const connectionsData = connections.map(conn => ({
      campaign_id: id,
      from_step_id: conn.from,
      to_step_id: conn.to,
      connection_type: conn.type || 'default',
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
