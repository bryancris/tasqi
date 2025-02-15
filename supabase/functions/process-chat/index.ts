
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

    // Fetch tasks for the user
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    // Count scheduled and unscheduled tasks
    const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
    const unscheduledTasks = tasks.filter(task => task.status === 'unscheduled');
    
    // Count today's tasks
    const todayTasks = tasks.filter(task => task.date === today);

    // Add task information to the message context
    const contextMessage = `
Current tasks status:
- Total active tasks: ${tasks.length}
- Scheduled tasks: ${scheduledTasks.length}
- Unscheduled tasks: ${unscheduledTasks.length}
- Tasks for today: ${todayTasks.length}

Today's tasks:
${todayTasks.map(task => `- ${task.title}`).join('\n')}

User message: ${message}
`;

    const result = await processWithOpenAI(contextMessage);
    console.log('OpenAI Processing Result:', result);

    // Save chat messages
    await saveChatMessages(supabase, userId, message, result.response);

    // Create task if the AI suggests one
    if (result.task?.should_create) {
      console.log('Creating task with details:', result.task);
      
      // Parse time strings if they exist
      const startTime = result.task.start_time || null;
      const endTime = result.task.end_time || null;

      // Get the next position for the task
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

      // Prepare task data
      const taskData = {
        title: result.task.title,
        description: result.task.description || '',
        status: result.task.is_scheduled ? 'scheduled' : 'unscheduled',
        date: result.task.date || null,
        start_time: startTime,
        end_time: endTime,
        position: nextPosition,
        priority: result.task.priority || 'low',
        user_id: userId,
        owner_id: userId
      };

      console.log('Creating task with data:', taskData);

      // Insert the main task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (taskError) {
        console.error('Error creating task:', taskError);
        throw taskError;
      }

      console.log('Created task:', task);

      // If the task has subtasks and was created successfully, create them
      if (result.task.subtasks && task) {
        const formattedSubtasks = result.task.subtasks.map((subtask: any, index: number) => {
          const subtaskTitle = typeof subtask === 'string' ? subtask : subtask.title;
          return {
            task_id: task.id,
            title: subtaskTitle,
            status: 'pending',
            position: index
          };
        });

        console.log('Creating subtasks:', formattedSubtasks);

        const { error: subtaskError } = await supabase
          .from('subtasks')
          .insert(formattedSubtasks);

        if (subtaskError) {
          console.error('Error creating subtasks:', subtaskError);
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
