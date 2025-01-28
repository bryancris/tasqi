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

    // Get AI response
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
            You can understand and create tasks, and engage in natural conversation.
            Previous conversation context:
            ${context}`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Generate embedding for AI response
    const aiEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: aiMessage,
        model: 'text-embedding-ada-002',
      }),
    });

    const aiEmbeddingData = await aiEmbeddingResponse.json();
    const aiEmbedding = aiEmbeddingData.data[0].embedding;

    // Store AI response with embedding
    const { error: aiInsertError } = await supabase
      .from('chat_messages')
      .insert({
        content: aiMessage,
        user_id: userId,
        embedding: aiEmbedding,
        is_ai: true,
      });

    if (aiInsertError) throw aiInsertError;

    return new Response(
      JSON.stringify({ response: aiMessage }),
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