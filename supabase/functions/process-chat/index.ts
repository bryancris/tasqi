import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface TaskArgs {
  should_create: boolean;
  title: string;
  description?: string;
  is_scheduled: boolean;
  date?: string;
  start_time?: string;
  end_time?: string;
}

interface OpenAIResponse {
  task?: TaskArgs;
  response: string;
}

// Helper Functions
async function getNextPosition(supabase: any, userId: string): Promise<number> {
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1);

  return existingTasks && existingTasks.length > 0 
    ? existingTasks[0].position + 1 
    : 1;
}

async function createTask(supabase: any, userId: string, taskData: TaskArgs): Promise<void> {
  const nextPosition = await getNextPosition(supabase, userId);
  
  const { error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: taskData.title,
      description: taskData.description || null,
      date: taskData.is_scheduled ? taskData.date : null,
      status: taskData.is_scheduled ? "scheduled" : "unscheduled",
      start_time: taskData.is_scheduled ? taskData.start_time : null,
      end_time: taskData.is_scheduled ? taskData.end_time : null,
      priority: "low", // Default to low priority as requested
      user_id: userId,
      position: nextPosition,
    });

  if (taskError) throw taskError;
}

async function processWithOpenAI(message: string): Promise<OpenAIResponse> {
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a task scheduling assistant. When a user mentions something that sounds like a task:
          1. If it has a specific time/date, create it as a scheduled task
          2. If no specific time/date is mentioned, create it as an unscheduled task
          3. Always extract as much detail as possible
          4. Default to low priority unless specifically mentioned
          
          Return JSON in this format:
          {
            "task": {
              "should_create": true,
              "title": "Task title",
              "description": "Optional description",
              "is_scheduled": true/false,
              "date": "YYYY-MM-DD" (if scheduled),
              "start_time": "HH:mm" (if scheduled),
              "end_time": "HH:mm" (if has duration)
            },
            "response": "Your friendly response to the user"
          }`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
    }),
  });

  if (!openAIResponse.ok) {
    const errorData = await openAIResponse.json();
    console.error('OpenAI API Error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await openAIResponse.json();
  console.log('OpenAI Response:', data);

  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse OpenAI response');
  }
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    console.log('Received message:', message, 'userId:', userId);

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process with OpenAI
    const result = await processWithOpenAI(message);
    console.log('Processed result:', result);

    // Create task if needed
    if (result.task?.should_create) {
      await createTask(supabase, userId, result.task);
    }

    // Save the conversation
    const { error: chatError } = await supabase
      .from('chat_messages')
      .insert([
        { content: message, is_ai: false, user_id: userId },
        { content: result.response, is_ai: true, user_id: userId }
      ]);

    if (chatError) throw chatError;

    return new Response(
      JSON.stringify({ response: result.response }),
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