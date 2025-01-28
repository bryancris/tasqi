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
  title?: string;
  description?: string;
  is_scheduled?: boolean;
  date?: string;
  start_time?: string;
  end_time?: string;
}

// OpenAI Configuration
const SYSTEM_PROMPT = `You are a helpful AI assistant that helps users manage their tasks and schedule. 
When a user mentions something that sounds like a task, analyze if it has a specific time/date.
If it has a specific time/date, create it as a scheduled task. If not, create it as an unscheduled task.
Respond naturally to the user and let them know what actions you've taken.`;

const TASK_FUNCTION = {
  name: "create_task",
  description: "Create a task when user mentions something that sounds like a task",
  parameters: {
    type: "object",
    properties: {
      should_create: {
        type: "boolean",
        description: "Whether a task should be created from this message"
      },
      title: {
        type: "string",
        description: "Title of the task"
      },
      description: {
        type: "string",
        description: "Optional description of the task"
      },
      is_scheduled: {
        type: "boolean",
        description: "Whether the task has a specific date/time"
      },
      date: {
        type: "string",
        description: "The date in YYYY-MM-DD format if specified"
      },
      start_time: {
        type: "string",
        description: "The start time in HH:mm format if specified"
      },
      end_time: {
        type: "string",
        description: "The end time in HH:mm format if specified"
      }
    },
    required: ["should_create"]
  }
};

// Helper Functions
async function fetchChatContext(supabase: any, userId: string): Promise<string> {
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('content, is_ai')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return messages
    ? messages.reverse().map((msg: any) => 
        `${msg.is_ai ? 'Assistant' : 'User'}: ${msg.content}`
      ).join('\n')
    : '';
}

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

async function createTask(supabase: any, userId: string, args: TaskArgs): Promise<void> {
  const nextPosition = await getNextPosition(supabase, userId);

  const { error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: args.title,
      description: args.description || null,
      date: args.is_scheduled ? args.date : null,
      status: args.is_scheduled ? "scheduled" : "unscheduled",
      start_time: args.is_scheduled ? args.start_time : null,
      end_time: args.is_scheduled ? args.end_time : null,
      user_id: userId,
      position: nextPosition,
      priority: "low"
    });

  if (taskError) throw taskError;
}

async function processOpenAIResponse(
  supabase: any, 
  userId: string, 
  aiMessage: any
): Promise<string> {
  let responseText = aiMessage.content || "I'm sorry, I couldn't process that request.";

  if (aiMessage.function_call?.name === "create_task") {
    try {
      const functionArgs = JSON.parse(aiMessage.function_call.arguments);
      console.log('Function arguments:', functionArgs);

      if (functionArgs.should_create && functionArgs.title) {
        await createTask(supabase, userId, functionArgs);
        const taskType = functionArgs.is_scheduled ? "scheduled" : "unscheduled";
        responseText = `I've added "${functionArgs.title}" to your ${taskType} tasks. ${responseText}`;
      }
    } catch (error) {
      console.error('Error processing function call:', error);
      throw error;
    }
  }

  return responseText;
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

    // Get recent chat context
    const context = await fetchChatContext(supabase, userId);

    // Process with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\nPrevious conversation context:\n${context}`
          },
          { role: 'user', content: message }
        ],
        functions: [TASK_FUNCTION],
        function_call: 'auto',
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    console.log('OpenAI Response:', data);

    if (!data.choices?.[0]?.message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    // Process the AI response and handle task creation
    const responseText = await processOpenAIResponse(
      supabase, 
      userId, 
      data.choices[0].message
    );

    // Save the conversation
    const { error: chatError } = await supabase
      .from('chat_messages')
      .insert([
        { content: message, is_ai: false, user_id: userId },
        { content: responseText, is_ai: true, user_id: userId }
      ]);

    if (chatError) throw chatError;

    return new Response(
      JSON.stringify({ response: responseText }),
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