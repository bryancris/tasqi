import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const { prompt, userId } = await req.json();

    // Process with OpenAI
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
            content: `You are a task scheduling assistant. Extract task information from user input and return it in JSON format with these fields:
              - title (string)
              - description (string, optional)
              - date (YYYY-MM-DD format if specified, null if not)
              - startTime (HH:mm format if specified, null if not)
              - endTime (HH:mm format if specified, null if not)
              - priority (either "low", "medium", or "high")
              
              Convert relative dates (tomorrow, next week, etc) to actual dates.
              If no priority is specified, default to "low".`
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await openAIResponse.json();
    const taskInfo = JSON.parse(aiData.choices[0].message.content);

    // Create task in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get highest position for user's tasks
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("position")
      .eq("user_id", userId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingTasks && existingTasks.length > 0 
      ? existingTasks[0].position + 1 
      : 1;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: taskInfo.title,
        description: taskInfo.description || null,
        date: taskInfo.date,
        status: taskInfo.date ? 'scheduled' : 'unscheduled',
        start_time: taskInfo.startTime,
        end_time: taskInfo.endTime,
        priority: taskInfo.priority,
        user_id: userId,
        position: nextPosition
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ task }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing task:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});