
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processWithOpenAI } from './openaiUtils.ts';
import { createTask } from './taskUtils.ts';
import { saveChatMessages } from './chatUtils.ts';
import { ChatRequest, SubtaskDetails } from './types.ts';
import { validateTimeFormat } from './dateUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json() as ChatRequest;
    console.log('Received request:', { message, userId });

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await processWithOpenAI(message);
    console.log('OpenAI Processing Result:', result);

    // Transform the result to ensure proper structure
    if (result.task?.subtasks) {
      result.task.subtasks = result.task.subtasks.map((subtask: any, index: number) => ({
        title: subtask.title || subtask,
        status: 'pending',
        position: index
      }));
    }

    // Save chat messages before handling task creation
    await saveChatMessages(supabase, userId, message, result.response);
    
    // Return the result immediately - task creation will be handled on the client side
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while processing your request' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
