
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

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
    console.log('Calling OpenAI to extract task information...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Updated to use current recommended model
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
              - subtasks (array of objects with title property, optional)
              
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
                  "priority": "low",
                  "subtasks": [
                    { "title": "Bring water bottle" },
                    { "title": "Take poop bags" }
                  ]
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
    
    // Validate the result has the expected structure
    if (!result || (result.task === null && result.response)) {
      console.log('No task identified in the message, returning response only');
      return new Response(
        JSON.stringify({
          success: false,
          taskCreated: false,
          response: result.response || "I couldn't identify a task in your request. Can you provide more details?"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    if (!result.task || !result.task.title) {
      console.error('Missing required task information:', result);
      return new Response(
        JSON.stringify({
          success: false,
          taskCreated: false,
          response: "I couldn't understand the task details. Please try describing your task more clearly."
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // If task information was extracted, create the task
    if (result.task && userId) {
      console.log('Creating task with data:', result.task);
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
        owner_id: userId,
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
        return new Response(
          JSON.stringify({ 
            success: false,
            error: taskError.message,
            response: `I couldn't create that task due to an error: ${taskError.message}. Please try again.`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.log('Task created successfully, ID:', taskResult?.[0]?.id);
      
      // Process subtasks if they exist
      if (result.task.subtasks && Array.isArray(result.task.subtasks) && taskResult?.[0]?.id) {
        const subtasks = result.task.subtasks.map((subtask: any, index: number) => ({
          task_id: taskResult[0].id,
          title: subtask.title,
          status: 'pending',
          position: index * 100,
          user_id: userId
        }));
        
        if (subtasks.length > 0) {
          const { error: subtasksError } = await supabase
            .from('subtasks')
            .insert(subtasks);
            
          if (subtasksError) {
            console.error('Error creating subtasks:', subtasksError);
          } else {
            console.log(`Created ${subtasks.length} subtasks successfully`);
          }
        }
      }
      
      // Return the created task along with the success message
      return new Response(
        JSON.stringify({
          success: true,
          task: taskResult?.[0] || null,
          response: result.response || `I've created a task titled "${result.task.title}" for you.`,
          taskData: taskData // Include the original task data for debugging
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If no task information was extracted or created
    return new Response(
      JSON.stringify({
        success: false,
        taskCreated: false,
        response: result.response || "I'm sorry, I couldn't identify a task in your request. Can you provide more details?"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred while processing your request',
        response: "I'm sorry, I encountered an error while trying to process your request. Please try again."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
