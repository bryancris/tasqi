
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.log('Received message:', message, 'userId:', userId);

    if (!userId) {
      throw new Error('No user ID provided');
    }

    // Process with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        temperature: 0.7,
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
              
              Convert relative dates (today, tomorrow, next week, etc) to actual dates.
              If no priority is specified, default to "low".
              If you cannot extract task information, return null.
              
              Example response format:
              {
                "task": {
                  "title": "Walk the dog",
                  "description": null,
                  "date": "2024-01-27",
                  "startTime": "09:00",
                  "endTime": null,
                  "priority": "low"
                },
                "response": "I've scheduled a task to walk the dog today at 9 AM. Would you like me to help you with anything else?"
              }`
          },
          { role: 'user', content: message }
        ]
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    console.log('OpenAI Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
      console.log('Parsed result:', result);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse OpenAI response');
    }
    
    // If task information was extracted, create the task
    if (result.task && userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Get highest position for user's tasks - improved position calculation
      const { data: existingTasks, error: positionError } = await supabase
        .from("tasks")
        .select("position")
        .eq("user_id", userId)
        .order("position", { ascending: false })
        .limit(1);
        
      if (positionError) {
        console.error('Error getting task positions:', positionError);
      }

      // Multiply by 1000 to allow for better positioning and sorting
      const nextPosition = existingTasks && existingTasks.length > 0 
        ? Math.ceil(existingTasks[0].position / 1000) * 1000 + 1000
        : 1000;
        
      console.log('Calculated next position:', nextPosition);

      // Determine task status based on date
      const taskStatus = result.task.date ? 'scheduled' : 'unscheduled';
      console.log('Determined task status:', taskStatus);

      const taskData = {
        title: result.task.title,
        description: result.task.description || '',
        date: result.task.date || null,
        status: taskStatus,
        start_time: result.task.startTime || null,
        end_time: result.task.endTime || null,
        priority: result.task.priority || 'low',
        position: nextPosition,
        user_id: userId,
        owner_id: userId, // Set owner_id equal to user_id
        shared: false,
        reminder_enabled: false,
        reminder_time: 15,
        is_all_day: false,
        reschedule_count: 0,
        time_spent: 0,
        is_tracking: false,
        assignees: []
      };
      
      console.log('Creating task with data:', taskData);

      const { data: taskResult, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select();

      if (taskError) {
        console.error('Error creating task:', taskError);
        throw taskError;
      }
      
      console.log('Task created successfully, ID:', taskResult?.[0]?.id);
      
      // Fetch all tasks for this user to verify
      const { data: allTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (fetchError) {
        console.error('Error fetching tasks for verification:', fetchError);
      } else {
        console.log('Recent tasks for user:', allTasks?.length || 0);
        console.log('Most recent task:', allTasks?.[0]);
      }
    }

    return new Response(
      JSON.stringify({
        response: result.response || "I'm sorry, I couldn't process that request."
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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
