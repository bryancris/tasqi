
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { extractDateFromMessage, formatDateForDB } from './dateUtils.ts'
import { generateResponse, isTaskCreationRequest } from './openaiUtils.ts'
import { 
  createTaskFromMessage, 
  isTaskQueryRequest, 
  getTasksForDate,
  getUnscheduledTasks,
  generateTaskSummary,
  getTaskCountForDate,
  getUnscheduledTaskCount
} from './taskUtils.ts'

// Define CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    const { message, userId } = await req.json()
    console.log('Received request:', { message, userId })

    // Store user message in database
    await supabase.from('chat_messages').insert({
      content: message,
      user_id: userId,
      is_ai: false
    })

    let response = ''
    let shouldCreateTask = false

    // Check if this is a query about unscheduled tasks
    if (message.toLowerCase().includes('unscheduled') && 
        message.toLowerCase().includes('task') && 
        (message.toLowerCase().includes('how many') || message.toLowerCase().includes('count'))) {
      console.log('Detected unscheduled task count query')
      
      const unscheduledCount = await getUnscheduledTaskCount(userId)
      
      response = `You have ${unscheduledCount} unscheduled task${unscheduledCount === 1 ? '' : 's'}.`
    }
    // Check if this is a task query request about task count
    else if (message.toLowerCase().includes('how many') && message.toLowerCase().includes('task') && 
        (message.toLowerCase().includes('today') || message.toLowerCase().includes('do i have'))) {
      console.log('Detected task count query request')
      
      // Extract date from message or default to today
      const extractedDate = extractDateFromMessage(message) || new Date()
      
      // Get task count for the extracted date
      const taskCount = await getTaskCountForDate(userId, extractedDate)
      
      // Get unscheduled task count for a complete picture
      const unscheduledCount = await getUnscheduledTaskCount(userId)
      
      // Generate a response with the task count
      response = `You have ${taskCount} task${taskCount === 1 ? '' : 's'} scheduled for ${extractedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.${unscheduledCount > 0 ? ` Additionally, you have ${unscheduledCount} unscheduled task${unscheduledCount === 1 ? '' : 's'}.` : ''}`
    }
    // Check if the user is asking what tasks they have today or similar
    else if (message.toLowerCase().includes('what') && 
            (message.toLowerCase().includes('today') || message.toLowerCase().includes('going on')) && 
            (message.toLowerCase().includes('have') || message.toLowerCase().includes('tasks'))) {
      console.log('Detected query about today\'s tasks')
      
      // Get today's date
      const today = new Date()
      
      // Get task count for today
      const taskCount = await getTaskCountForDate(userId, today)
      
      // Get unscheduled task count
      const unscheduledCount = await getUnscheduledTaskCount(userId)
      
      // Get tasks for today to provide details
      const tasks = await getTasksForDate(userId, today)
      
      if (taskCount === 0 && unscheduledCount === 0) {
        response = `You don't have any tasks scheduled for today or in your unscheduled list. Enjoy your free day!`
      } else {
        // Generate a detailed summary of tasks
        response = generateTaskSummary(tasks, today)
        
        // Add unscheduled tasks count if any
        if (unscheduledCount > 0) {
          response += ` You also have ${unscheduledCount} unscheduled task${unscheduledCount === 1 ? '' : 's'}.`
        }
      }
    }
    // Check if this is a task query request (asking about tasks)
    else if (isTaskQueryRequest(message)) {
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
