// API route for templates CRUD operations
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      return getTemplates(req, res)
    case 'POST':
      return createTemplate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

// Get all templates (system templates + user's custom templates)
async function getTemplates(req, res) {
  try {
    const { category, user_id } = req.query

    let query = supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Get system templates and user's custom templates
    // RLS policies will handle the access control
    if (user_id) {
      query = query.or(`is_system.eq.true,user_id.eq.${user_id}`)
    } else {
      // If no user_id provided, only return system templates
      query = query.eq('is_system', true)
    }

    const { data, error } = await query

    if (error) throw error

    return res.status(200).json({ templates: data || [] })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Create custom template from existing campaign
async function createTemplate(req, res) {
  try {
    const { name, description, category, steps, user_id, thumbnail } = req.body

    // Validate required fields
    if (!name || !category || !steps || !user_id) {
      return res.status(400).json({
        error: 'Missing required fields: name, category, steps, user_id'
      })
    }

    // Validate category
    const validCategories = [
      'lead-generation',
      'product-feedback',
      'customer-survey',
      'faq',
      'support',
      'training'
    ]
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      })
    }

    const { data, error } = await supabase
      .from('templates')
      .insert([
        {
          name,
          description: description || '',
          category,
          steps,
          is_system: false, // User-created templates are never system templates
          user_id,
          thumbnail: thumbnail || null
        },
      ])
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ template: data })
  } catch (error) {
    console.error('Error creating template:', error)
    return res.status(500).json({ error: error.message })
  }
}
