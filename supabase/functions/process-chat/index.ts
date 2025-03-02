
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { extractDateFromMessage, formatDateForDB } from './dateUtils.ts'
import { generateResponse, isTaskCreationRequest } from './openaiUtils.ts'
import { 
  createTaskFromMessage, 
  isTaskQueryRequest, 
  getTasksForDate, 
  generateTaskSummary 
} from './taskUtils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, userId } = await req.json()

    // Store user message in database
    await supabase.from('chat_messages').insert({
      content: message,
      user_id: userId,
      is_ai: false
    })

    let response = ''
    let shouldCreateTask = false

    // Check if this is a task query request (asking about tasks)
    if (isTaskQueryRequest(message)) {
      console.log('Detected task query request')
      
      // Extract date from message or default to today
      const extractedDate = extractDateFromMessage(message) || new Date()
      
      // Get tasks for the extracted date
      const tasks = await getTasksForDate(userId, extractedDate)
      
      // Generate a summary of tasks
      response = generateTaskSummary(tasks, extractedDate)
    }
    // Check if this appears to be a task creation request
    else if (isTaskCreationRequest(message)) {
      console.log('Detected task creation request')
      shouldCreateTask = true
      
      // Will handle task creation after storing AI response
      response = "I've created that task for you."
    } 
    // Regular conversation message
    else {
      console.log('Regular conversation message')
      // Generate response using AI
      response = await generateResponse(message)
    }

    // Store AI response in database
    await supabase.from('chat_messages').insert({
      content: response,
      user_id: userId,
      is_ai: true
    })

    // If this was a task creation request, create the task
    if (shouldCreateTask) {
      await createTaskFromMessage(message, userId)
    }

    return new Response(
      JSON.stringify({ response }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error processing chat:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
