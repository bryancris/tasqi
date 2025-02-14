
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

    // Save chat messages
    await saveChatMessages(supabase, userId, message, result.response);

    // Create task if the AI suggests one
    if (result.task?.should_create) {
      console.log('Creating task with details:', result.task);

      // Get the next position for the task
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

      // Insert the main task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: result.task.title,
          description: result.task.description || '',
          status: result.task.is_scheduled ? 'scheduled' : 'unscheduled',
          date: result.task.date || new Date().toISOString().split('T')[0],
          position: nextPosition,
          user_id: userId,
          owner_id: userId
        })
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        throw taskError;
      }

      // If the task has subtasks, create them
      if (result.task.subtasks && task) {
        const subtasks = result.task.subtasks.map((subtask: any, index: number) => ({
          task_id: task.id,
          title: subtask.title || subtask,
          status: 'pending',
          position: index
        }));

        const { error: subtaskError } = await supabase
          .from('subtasks')
          .insert(subtasks);

        if (subtaskError) {
          console.error('Error creating subtasks:', subtaskError);
          throw subtaskError;
        }
      }
    }

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
