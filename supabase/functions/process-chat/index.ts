
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { openAIHandler } from "./openaiUtils.ts";
import { parseTimerIntent, cancelTimer, checkTimerStatus } from "./chatUtils.ts";
import { isToday, addMinutes, parseISO, format } from "./dateUtils.ts";
import { processTaskCommand, fetchRecentTasks } from "./taskUtils.ts";
import type { ChatMessage, TimerData } from "./types.ts";

// CORS headers for browser clients
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
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const { message, userId } = body;

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for timer intents
    const timerIntent = parseTimerIntent(message);
    
    if (timerIntent) {
      console.log("Timer intent detected:", timerIntent);
      
      if (timerIntent.action === 'create') {
        // Create a new timer
        const expiresAt = addMinutes(new Date(), timerIntent.minutes);
        
        const { data: timer, error: timerError } = await supabase
          .from('timer_sessions')
          .insert({
            user_id: userId,
            label: timerIntent.label || null,
            duration_minutes: timerIntent.minutes,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            is_completed: false
          })
          .select()
          .single();
        
        if (timerError) {
          console.error("Error creating timer:", timerError);
          return new Response(
            JSON.stringify({ 
              response: "I had trouble setting your timer. Please try again." 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Format response with the timer information
        const formattedTime = format(expiresAt, 'h:mm a');
        const timerResponse = timerIntent.label
          ? `I've set a timer for ${timerIntent.minutes} minutes for "${timerIntent.label}". I'll notify you at ${formattedTime}.`
          : `I've set a timer for ${timerIntent.minutes} minutes. I'll notify you at ${formattedTime}.`;
        
        return new Response(
          JSON.stringify({ response: timerResponse }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (timerIntent.action === 'cancel') {
        // Cancel active timers
        const cancelResult = await cancelTimer(supabase, userId);
        return new Response(
          JSON.stringify({ response: cancelResult.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (timerIntent.action === 'check') {
        // Check status of active timers
        const statusResult = await checkTimerStatus(supabase, userId);
        return new Response(
          JSON.stringify({ response: statusResult.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Continue with task processing and OpenAI for other messages
    const taskCommandResponse = await processTaskCommand(message, userId, supabase);
    if (taskCommandResponse.isTaskCommand) {
      return new Response(
        JSON.stringify({ response: taskCommandResponse.response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent tasks for context
    const recentTasks = await fetchRecentTasks(supabase, userId);
    
    // Fetch recent chat history for context
    const { data: chatHistory, error: chatError } = await supabase
      .from('chat_messages')
      .select('content, is_ai, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (chatError) {
      console.error("Error fetching chat history:", chatError);
    }
    
    // Process the message with OpenAI
    const formattedHistory = (chatHistory || [])
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(msg => ({
        content: msg.content,
        role: msg.is_ai ? 'assistant' : 'user'
      }));
    
    const aiResponse = await openAIHandler(message, formattedHistory, recentTasks);
    
    // Store the messages in the database
    await supabase.from('chat_messages').insert([
      { user_id: userId, content: message, is_ai: false },
      { user_id: userId, content: aiResponse, is_ai: true }
    ]);
    
    // Return the response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
