// API route for individual template operations
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Template ID is required' })
  }

  switch (method) {
    case 'GET':
      return getTemplate(req, res, id)
    case 'DELETE':
      return deleteTemplate(req, res, id)
    default:
      res.setHeader('Allow', ['GET', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

// Get specific template by ID
async function getTemplate(req, res, id) {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Template not found' })
      }
      throw error
    }

    return res.status(200).json({ template: data })
  } catch (error) {
    console.error('Error fetching template:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Delete custom template (only user's own templates, not system templates)
async function deleteTemplate(req, res, id) {
  try {
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // First check if template exists and is deletable
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('is_system, user_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Template not found' })
      }
      throw fetchError
    }

    // Prevent deletion of system templates
    if (template.is_system) {
      return res.status(403).json({
        error: 'Cannot delete system templates'
      })
    }

    // Prevent deletion of other users' templates
    if (template.user_id !== user_id) {
      return res.status(403).json({
        error: 'You can only delete your own templates'
      })
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id) // Extra safety check

    if (deleteError) throw deleteError

    return res.status(200).json({
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return res.status(500).json({ error: error.message })
  }
}
