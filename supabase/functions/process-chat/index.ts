
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processMessage, createTaskFromMessage } from './taskUtils.ts';
import { openaiCompletion } from './openaiUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { message, userId } = await req.json();

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Set up Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Log the message for debugging
    console.log(`Processing message from user ${userId}: ${message}`);

    // First, check if the message is likely a task request
    const isTaskRequest = isTaskCreationRequest(message);
    
    if (isTaskRequest) {
      try {
        // Process the message to extract task information
        const taskData = await processMessage(message, userId);
        
        // Create the task in the database
        const createdTask = await createTaskFromMessage(taskData);
        
        // Store the message and AI response in the chat history
        const taskResponse = generateTaskResponse(taskData);
        await storeConversation(supabase, message, taskResponse, userId);
        
        // Return the response
        return new Response(
          JSON.stringify({ 
            response: taskResponse, 
            taskCreated: true,
            taskData: createdTask?.[0] || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error creating task:', error);
        
        // If task creation fails, fall back to AI response
        const aiResponse = await getAIResponse(message, userId);
        return new Response(
          JSON.stringify({ response: aiResponse, taskCreated: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For non-task-related messages, use OpenAI to generate a response
      const aiResponse = await getAIResponse(message, userId);
      
      // Store the conversation in the database
      await storeConversation(supabase, message, aiResponse, userId);
      
      // Return the AI response
      return new Response(
        JSON.stringify({ response: aiResponse, taskCreated: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to process the request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Determines if a message is likely requesting task creation
 */
function isTaskCreationRequest(message: string): boolean {
  const taskKeywords = [
    'schedule', 'remind', 'task', 'appointment', 'meeting', 'event',
    'create', 'add', 'set up', 'make', 'put', 'set'
  ];
  
  const timeIndicators = [
    'today', 'tomorrow', 'morning', 'afternoon', 'evening', 
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'next week', 'am', 'pm', 'o\'clock'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Check if the message contains task-related keywords
  const hasTaskKeyword = taskKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`).test(lowerMessage)
  );
  
  // Check if the message contains time-related indicators
  const hasTimeIndicator = timeIndicators.some(indicator => 
    new RegExp(`\\b${indicator}\\b`).test(lowerMessage)
  );
  
  // Check for time patterns like "4pm", "3:00 PM" or "15:00"
  const hasTimePattern = /\b((1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm|a|p)|([01]?[0-9]|2[0-3]):([0-5][0-9]))\b/i.test(lowerMessage);
  
  // Check for date patterns like "05/20" or "May 20"
  const hasDatePattern = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/.test(lowerMessage) ||
                         /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+\d{1,2}\b/i.test(lowerMessage);
  
  // Consider it a task request if it has a task keyword AND either time or date indicators
  return hasTaskKeyword && (hasTimeIndicator || hasTimePattern || hasDatePattern);
}

/**
 * Generates a response confirming task creation
 */
function generateTaskResponse(taskData: any): string {
  let response = `✅ I've added "${taskData.title}" to your tasks`;
  
  if (taskData.isScheduled) {
    response += ' for';
    
    if (taskData.date) {
      // Format date in a readable way
      const date = new Date(taskData.date);
      response += ` ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    }
    
    if (taskData.startTime) {
      // Format time in a readable way
      const [hours, minutes] = taskData.startTime.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      
      response += ` at ${hour12}:${minutes} ${period}`;
    }
  }
  
  response += `. Priority: ${taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1)}`;
  
  return response;
}

/**
 * Stores a conversation in the database
 */
async function storeConversation(supabase: any, userMessage: string, aiResponse: string, userId: string) {
  try {
    // First store the user message
    await supabase.from('chat_messages').insert({
      content: userMessage,
      user_id: userId,
      is_ai: false
    });
    
    // Then store the AI response
    await supabase.from('chat_messages').insert({
      content: aiResponse,
      user_id: userId,
      is_ai: true
    });
  } catch (error) {
    console.error('Error storing conversation:', error);
    // We don't want to fail the entire request if storage fails
  }
}

/**
 * Gets an AI response from OpenAI
 */
async function getAIResponse(message: string, userId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user's tasks for context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Format the context information
    let context = '';
    
    if (tasks && tasks.length > 0) {
      context += "User's recent tasks:\n";
      tasks.forEach((task: any, index: number) => {
        context += `${index + 1}. "${task.title}" - ${task.status} - Priority: ${task.priority}\n`;
      });
      context += '\n';
    }
    
    if (recentMessages && recentMessages.length > 0) {
      context += "Recent conversation:\n";
      // Reverse to get chronological order
      const chronologicalMessages = [...recentMessages].reverse().slice(0, 6);
      chronologicalMessages.forEach((msg: any) => {
        context += `${msg.is_ai ? 'AI' : 'User'}: ${msg.content}\n`;
      });
    }
    
    // Get response from OpenAI
    const openaiResponse = await openaiCompletion(message, context);
    return openaiResponse || "I'm not sure how to respond to that. Can you try again?";
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm having trouble processing your request right now. Please try again later.";
  }
}
