// API route for campaign response collection
import { supabase } from '../../../../lib/supabase'
import { logger } from '../../../../lib/logger'

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query

  logger.info(`Response API called`, { method, campaignId: id })

  switch (method) {
    case 'POST':
      return createResponse(req, res, id)
    case 'GET':
      return getResponses(req, res, id)
    default:
      res.setHeader('Allow', ['POST', 'GET'])
      return res.status(405).json({ error: `Method ${method} Not Allowed` })
  }
}

// Create or update a response
async function createResponse(req, res, campaignId) {
  try {
    const {
      sessionId,
      stepId,
      stepNumber,
      answerType,
      answerData,
      userName,
      email,
      completed,
      duration,
      deviceType,
      userAgent
    } = req.body

    logger.info('Creating/updating response', {
      campaignId,
      sessionId,
      stepNumber,
      answerType
    })

    // Check if response already exists for this session
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('data->>sessionId', sessionId)
      .single()

    if (existingResponse) {
      // Update existing response - append new step data
      const existingData = existingResponse.data || {}
      const steps = existingData.steps || []

      // Check if this step was already answered
      const stepIndex = steps.findIndex(s => s.stepId === stepId)
      const newStepData = {
        stepId,
        stepNumber,
        answerType,
        answerData,
        timestamp: new Date().toISOString()
      }

      if (stepIndex >= 0) {
        // Update existing step
        steps[stepIndex] = newStepData
      } else {
        // Add new step
        steps.push(newStepData)
      }

      const { data: updatedResponse, error } = await supabase
        .from('responses')
        .update({
          user_name: userName || existingResponse.user_name,
          email: email || existingResponse.email,
          completed: completed || false,
          duration: duration || existingResponse.duration,
          data: {
            ...existingData,
            sessionId,
            steps,
            deviceType: deviceType || existingData.deviceType,
            userAgent: userAgent || existingData.userAgent,
            lastUpdated: new Date().toISOString()
          },
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', existingResponse.id)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({
        response: updatedResponse,
        message: 'Response updated successfully'
      })
    } else {
      // Create new response
      const { data: newResponse, error } = await supabase
        .from('responses')
        .insert([{
          campaign_id: campaignId,
          user_name: userName || null,
          email: email || null,
          completed: completed || false,
          duration: duration || 0,
          data: {
            sessionId,
            deviceType: deviceType || 'unknown',
            userAgent: userAgent || '',
            steps: [{
              stepId,
              stepNumber,
              answerType,
              answerData,
              timestamp: new Date().toISOString()
            }],
            startedAt: new Date().toISOString()
          }
        }])
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        response: newResponse,
        message: 'Response created successfully'
      })
    }
  } catch (error) {
    console.error('Error saving response:', error)
    return res.status(500).json({ error: error.message })
  }
}

// Get all responses for a campaign
async function getResponses(req, res, campaignId) {
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({
      responses: responses || [],
      count: responses?.length || 0
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return res.status(500).json({ error: error.message })
  }
}
