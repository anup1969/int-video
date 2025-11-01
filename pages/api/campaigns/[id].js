// API route for single campaign operations
import { supabase } from '../../../lib/supabase'
import logger from '../../../lib/logger'

export default async function handler(req, res) {
  const { method, query } = req
  const { id } = query

  switch (method) {
    case 'GET':
      return getCampaign(req, res, id)
    case 'PUT':
      return updateCampaign(req, res, id)
    case 'DELETE':
      return deleteCampaign(req, res, id)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

// Get single campaign with all steps and connections
async function getCampaign(req, res, id) {
  logger.info('Get campaign request', { campaignId: id });

  try {
    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (campaignError) throw campaignError

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Get steps
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('campaign_id', id)
      .order('step_number', { ascending: true })

    if (stepsError) throw stepsError

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('campaign_id', id)

    if (connectionsError) throw connectionsError

    logger.info('Campaign loaded successfully', {
      campaignId: id,
      stepCount: steps?.length,
      connectionCount: connections?.length
    });

    return res.status(200).json({
      campaign,
      steps: steps || [],
      connections: connections || [],
    })
  } catch (error) {
    logger.error('Error fetching campaign', { campaignId: id, error: error.message });
    return res.status(500).json({ error: error.message })
  }
}

// Update campaign
async function updateCampaign(req, res, id) {
  try {
    const { name, status, settings } = req.body

    const updates = {}
    if (name !== undefined) updates.name = name
    if (status !== undefined) updates.status = status
    if (settings !== undefined) updates.settings = settings

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ campaign: data })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Delete campaign (will cascade delete steps and connections)
async function deleteCampaign(req, res, id) {
  try {
    const { error } = await supabase.from('campaigns').delete().eq('id', id)

    if (error) throw error

    return res.status(200).json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return res.status(500).json({ error: error.message })
  }
}
