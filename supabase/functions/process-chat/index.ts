
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { processChatWithOpenAI } from './openaiUtils.ts';
import { checkForTaskIntent, extractTaskDetails, createTaskFromChat } from './taskUtils.ts';
import { extractDateFromText } from './dateUtils.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { message, userId } = await req.json();
    console.log('Received message:', message);
    console.log('From user:', userId);
    
    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Store the user message in the database
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        content: message,
        user_id: userId,
        is_ai: false
      });
      
    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
    }
    
    // Get recent conversation history for context
    const { data: previousMessages, error: historyError } = await supabase
      .from('chat_messages')
      .select('content, is_ai')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (historyError) {
      console.error('Error fetching message history:', historyError);
    }
    
    // Format previous messages for OpenAI API
    const formattedPreviousMessages = (previousMessages || [])
      .reverse()
      .map(msg => ({
        role: msg.is_ai ? 'assistant' : 'user',
        content: msg.content
      }));
    
    // Process the message with OpenAI
    const aiResponse = await processChatWithOpenAI(message, userId, formattedPreviousMessages);
    
    // Store the AI response in the database
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        content: aiResponse,
        user_id: userId,
        is_ai: true
      });
      
    if (aiMessageError) {
      console.error('Error storing AI message:', aiMessageError);
    }
    
    // Check if the message seems to be about creating a task
    const hasTaskIntent = checkForTaskIntent(message);
    console.log('Task intent detected:', hasTaskIntent);
    
    let taskCreated = false;
    let task = null;
    
    if (hasTaskIntent) {
      // Extract task details from the message
      const taskDetails = extractTaskDetails(message, message);
      console.log('Extracted task details:', taskDetails);
      
      // Check if we have enough details to create a task
      if (taskDetails.title) {
        // Create the task
        task = await createTaskFromChat(userId, taskDetails);
        taskCreated = true;
        console.log('Task created:', task);
      }
    }
    
    // Create a task event that will be triggered from the client code
    // This allows us to update the client's task list without refreshing
    const aiEvent = {
      response: aiResponse,
      task: taskCreated ? task[0] : null
    };
    
    return new Response(
      JSON.stringify(aiEvent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
