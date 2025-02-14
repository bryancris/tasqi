
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

    // Handle adding subtasks to existing task
    if (result.task?.should_add_subtasks && result.task.subtasks) {
      console.log('Adding subtasks:', result.task.subtasks);
      
      // Get the latest task for the user
      const { data: latestTask, error: taskError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (taskError) {
        console.error('Error finding latest task:', taskError);
        throw taskError;
      }

      if (!latestTask) {
        return new Response(
          JSON.stringify({ 
            response: "I couldn't find an active task to add subtasks to. Please create a task first." 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prepare subtasks for insertion
      const subtasksToAdd = result.task.subtasks.map((subtask: SubtaskDetails) => ({
        task_id: latestTask.id,
        title: subtask.title,
        status: subtask.status,
        position: subtask.position
      }));

      // Insert the subtasks
      const { error: insertError } = await supabase
        .from('subtasks')
        .insert(subtasksToAdd);

      if (insertError) {
        console.error('Error adding subtasks:', insertError);
        throw insertError;
      }
    }
    // Handle creating a new task with subtasks
    else if (result.task?.should_create) {
      console.log('Creating task with subtasks:', result.task);
      
      const startTime = validateTimeFormat(result.task.start_time);
      const endTime = validateTimeFormat(result.task.end_time);

      // Create the task with all details including subtasks
      await createTask(supabase, userId, {
        title: result.task.title,
        description: result.task.description,
        date: result.task.date || 'today',
        startTime,
        endTime,
        isScheduled: result.task.is_scheduled,
        priority: result.task.priority,
        subtasks: result.task.subtasks || []
      });
    }

    // Save chat messages
    await saveChatMessages(supabase, userId, message, result.response);

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
