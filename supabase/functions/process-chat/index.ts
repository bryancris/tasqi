import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    console.log('Processing message:', message, 'for user:', userId);

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate embedding for the message
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: message,
        model: 'text-embedding-ada-002',
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Store user message with embedding
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        content: message,
        user_id: userId,
        embedding,
        is_ai: false,
      });

    if (insertError) throw insertError;

    // Fetch relevant context from previous messages
    const { data: similarMessages } = await supabase
      .rpc('match_chat_messages', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
        user_id: userId,
      });

    // Prepare context for AI
    const context = similarMessages
      ?.map(msg => `${msg.is_ai ? 'Assistant' : 'User'}: ${msg.content}`)
      .join('\n') || '';

    // Get AI response and task analysis
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant that helps users manage their tasks and schedule. 
            When a user mentions something that sounds like a task but doesn't provide a date or time, 
            create it as an unscheduled task. Respond naturally to the user and let them know what actions you've taken.
            Previous conversation context:
            ${context}`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        functions: [
          {
            name: "create_unscheduled_task",
            description: "Create an unscheduled task when user mentions something that sounds like a task without specific timing",
            parameters: {
              type: "object",
              properties: {
                should_create: {
                  type: "boolean",
                  description: "Whether this message contains a task that should be created"
                },
                title: {
                  type: "string",
                  description: "The title of the task"
                },
                description: {
                  type: "string",
                  description: "Optional description of the task"
                }
              },
              required: ["should_create"]
            }
          }
        ],
        function_call: "auto"
      }),
    });

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message;
    let responseText = aiMessage.content;

    // Handle task creation if the AI detected one
    if (aiMessage.function_call?.name === "create_unscheduled_task") {
      const functionArgs = JSON.parse(aiMessage.function_call.arguments);
      
      if (functionArgs.should_create) {
        // Get the highest position number for the current user
        const { data: existingTasks } = await supabase
          .from("tasks")
          .select("position")
          .eq("user_id", userId)
          .order("position", { ascending: false })
          .limit(1);

        const nextPosition = existingTasks && existingTasks.length > 0 
          ? existingTasks[0].position + 1 
          : 1;

        // Create the unscheduled task
        const { error: taskError } = await supabase
          .from("tasks")
          .insert({
            title: functionArgs.title,
            description: functionArgs.description || null,
            status: "unscheduled",
            user_id: userId,
            position: nextPosition,
            priority: "low"
          });

        if (taskError) throw taskError;
      }
    }

    // Generate embedding for AI response
    const aiEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: responseText,
        model: 'text-embedding-ada-002',
      }),
    });

    const aiEmbeddingData = await aiEmbeddingResponse.json();
    const aiEmbedding = aiEmbeddingData.data[0].embedding;

    // Store AI response with embedding
    const { error: aiInsertError } = await supabase
      .from('chat_messages')
      .insert({
        content: responseText,
        user_id: userId,
        embedding: aiEmbedding,
        is_ai: true,
      });

    if (aiInsertError) throw aiInsertError;

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});