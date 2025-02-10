
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processWithOpenAI } from './openaiUtils.ts';
import { createTask } from './taskUtils.ts';
import { saveChatMessages } from './chatUtils.ts';
import { ChatRequest } from './types.ts';
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process message with OpenAI
    const result = await processWithOpenAI(message);
    console.log('Processed result:', result);

    // Handle task completion if detected
    if (result.task?.should_complete && result.task.task_title) {
      console.log('Completing task:', result.task.task_title);
      
      // Find matching task with case-insensitive comparison
      const { data: tasks, error: findError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', userId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (findError) {
        console.error('Error finding task:', findError);
        throw findError;
      }

      // Find the best matching task
      const taskTitle = result.task.task_title.toLowerCase();
      const matchingTask = tasks?.find(task => 
        task.title.toLowerCase().includes(taskTitle) || 
        taskTitle.includes(task.title.toLowerCase())
      );

      if (matchingTask) {
        console.log('Found matching task:', matchingTask);
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', matchingTask.id);

        if (updateError) {
          console.error('Error updating task:', updateError);
          throw updateError;
        }
      } else {
        console.log('No matching task found');
      }
    }
    // Create task if needed
    else if (result.task?.should_create) {
      const startTime = validateTimeFormat(result.task.start_time);
      const endTime = validateTimeFormat(result.task.end_time);

      await createTask(supabase, userId, {
        title: result.task.title,
        description: result.task.description,
        date: result.task.date,
        startTime,
        endTime,
        isScheduled: result.task.is_scheduled,
        priority: result.task.priority,
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
