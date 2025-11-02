// API route for campaigns CRUD operations
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      return getCampaigns(req, res)
    case 'POST':
      return createCampaign(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

// Get all campaigns
async function getCampaigns(req, res) {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get response counts for all campaigns
    const campaignsWithCounts = await Promise.all(
      data.map(async (campaign) => {
        const { count, error: countError } = await supabase
          .from('responses')
          .select('session_id', { count: 'exact', head: false })
          .eq('campaign_id', campaign.id)
          .eq('completed', true)

        if (countError) {
          console.error('Error counting responses:', countError)
          return { ...campaign, response_count: 0 }
        }

        // Count unique sessions
        const { data: sessions } = await supabase
          .from('responses')
          .select('session_id')
          .eq('campaign_id', campaign.id)
          .eq('completed', true)

        const uniqueSessions = new Set(sessions?.map(s => s.session_id) || [])

        return { ...campaign, response_count: uniqueSessions.size }
      })
    )

    return res.status(200).json({ campaigns: campaignsWithCounts })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Create new campaign
async function createCampaign(req, res) {
  try {
    const { name, settings } = req.body

    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          name: name || 'Untitled Campaign',
          status: 'draft',
          settings: settings || {},
        },
      ])
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ campaign: data })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return res.status(500).json({ error: error.message })
  }
}
