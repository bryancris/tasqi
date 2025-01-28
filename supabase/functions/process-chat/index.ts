import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface ChatRequest {
  message: string;
  userId: string;
}

interface TaskDetails {
  title: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isScheduled: boolean;
}

interface OpenAIResponse {
  task?: {
    should_create: boolean;
    title: string;
    description?: string;
    is_scheduled: boolean;
    date?: string;
    start_time?: string;
    end_time?: string;
  };
  response: string;
}

// Constants
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a task scheduling assistant. When a user mentions something that sounds like a task:
1. If it has a specific time/date, create it as a scheduled task
2. If no specific time/date is mentioned, create it as an unscheduled task
3. Always extract as much detail as possible
4. Always set priority to "low" unless specifically mentioned
5. For scheduled tasks, ALWAYS return time in HH:mm format (24-hour)
6. Only include time fields if they are explicitly mentioned

Return JSON in this format:
{
  "task": {
    "should_create": true,
    "title": "Task title",
    "description": "Optional description",
    "is_scheduled": true/false,
    "date": "YYYY-MM-DD" (if scheduled),
    "start_time": "HH:mm" (if time specified),
    "end_time": "HH:mm" (if duration specified)
  },
  "response": "Your friendly response to the user"
}`;

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

function validateTimeFormat(time: string | undefined): string | null {
  if (!time) return null;
  
  // Check if time matches HH:mm format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time) ? time : null;
}

async function processWithOpenAI(message: string): Promise<OpenAIResponse> {
  console.log('Processing message with OpenAI:', message);
  
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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

async function createTask(supabase: any, userId: string, taskDetails: TaskDetails): Promise<void> {
  console.log('Creating task with details:', taskDetails);
  
  const nextPosition = await getNextPosition(supabase, userId);
  
  // Validate time fields
  const startTime = validateTimeFormat(taskDetails.startTime);
  const endTime = validateTimeFormat(taskDetails.endTime);
  
  const { error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: taskDetails.title,
      description: taskDetails.description || null,
      date: taskDetails.isScheduled ? taskDetails.date : null,
      status: taskDetails.isScheduled ? "scheduled" : "unscheduled",
      start_time: startTime,
      end_time: endTime,
      priority: "low",
      user_id: userId,
      position: nextPosition,
    });

  if (taskError) {
    console.error('Error creating task:', taskError);
    throw taskError;
  }
}

async function saveChatMessages(supabase: any, userId: string, userMessage: string, aiResponse: string): Promise<void> {
  const { error: chatError } = await supabase
    .from('chat_messages')
    .insert([
      { content: userMessage, is_ai: false, user_id: userId },
      { content: aiResponse, is_ai: true, user_id: userId }
    ]);

  if (chatError) {
    console.error('Error saving chat messages:', chatError);
    throw chatError;
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json() as ChatRequest;
    console.log('Received request:', { message, userId });

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process message with OpenAI
    const result = await processWithOpenAI(message);
    console.log('Processed result:', result);

    // Create task if needed
    if (result.task?.should_create) {
      await createTask(supabase, userId, {
        title: result.task.title,
        description: result.task.description,
        date: result.task.date,
        startTime: result.task.start_time,
        endTime: result.task.end_time,
        isScheduled: result.task.is_scheduled,
      });
    }

    // Save chat messages
    await saveChatMessages(supabase, userId, message, result.response);

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