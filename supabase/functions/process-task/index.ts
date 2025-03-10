
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and validate the request payload
    let requestPayload;
    try {
      requestPayload = await req.json();
    } catch (error) {
      console.error('Error parsing request JSON:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { message, userId } = requestPayload;
    console.log('📝 Received task creation request:', { message: message?.substring(0, 50) + '...', userId });

    // Validate required fields
    if (!message || typeof message !== 'string') {
      console.error('Missing or invalid message parameter');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid message parameter' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!userId) {
      console.error('No user ID provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No user ID provided' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process with OpenAI
    console.log('🧠 Calling OpenAI to extract task information...');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Making API request to OpenAI with message:', message);
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using current recommended model
        temperature: 0.5, // Lower temperature for more deterministic results
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
              
              IMPORTANT: Only extract tasks if the user is EXPLICITLY requesting to create one.
              If the user is just mentioning something they need to do without explicitly asking to create a task, respond with:
              {
                "task": null,
                "response": "Would you like me to create a task for this? Please confirm if you'd like me to add this to your tasks."
              }
              
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
      let errorMessage = 'OpenAI API error';
      try {
        const errorData = await openAIResponse.json();
        console.error('OpenAI API Error:', errorData);
        errorMessage = `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`;
      } catch (e) {
        console.error('Failed to parse OpenAI error response');
        errorMessage = `OpenAI API error: Status ${openAIResponse.status}`;
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          response: "I'm having trouble understanding your task. Could you try describing it differently?"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse OpenAI response
    let data;
    try {
      data = await openAIResponse.json();
      console.log('🧠 OpenAI Response structure:', 
        { choices: data.choices?.length, model: data.model, usage: data.usage });
      console.log('OpenAI response first choice message:', data.choices?.[0]?.message);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to parse OpenAI response',
          response: "I encountered an error processing your task. Please try again."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response structure from OpenAI',
          response: "I couldn't extract the task details from your request. Could you be more specific?"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the task data from OpenAI's response
    let result;
    try {
      const content = data.choices[0].message.content;
      console.log('📄 Raw OpenAI content:', content);
      result = JSON.parse(content);
      console.log('🧩 Parsed task data:', result);
    } catch (error) {
      console.error('Error parsing OpenAI JSON response:', error);
      // Try a more lenient approach to extract the JSON
      try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log('Attempting to parse extracted JSON:', jsonStr);
          result = JSON.parse(jsonStr);
          console.log('Successfully parsed JSON with lenient extraction:', result);
        } else {
          throw new Error('No JSON object found in response');
        }
      } catch (fallbackError) {
        console.error('Even fallback JSON parsing failed:', fallbackError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to parse OpenAI task JSON',
            response: "I couldn't process your task data. Please try describing your task more clearly."
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    // If OpenAI couldn't identify a task, return the response without creating one
    if (!result || !result.task) {
      console.log('⚠️ No task identified in the message.');
      return new Response(
        JSON.stringify({
          success: false,
          taskCreated: false,
          response: result?.response || "I couldn't identify a task in your request. Please let me know if you'd like to create a task and provide more details."
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Validate the task data
    if (!result.task.title) {
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
      console.log('💾 Creating task with data:', result.task);
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
        
      console.log('📊 Calculated next position:', nextPosition);

      // Determine task status based on date
      const taskStatus = result.task.date ? 'scheduled' : 'unscheduled';
      console.log('📋 Determined task status:', taskStatus);

      // Fix: Only set is_all_day to true if the task has a date AND it's meant to be all day
      // This ensures unscheduled tasks don't get marked as all-day events
      const isAllDay = result.task.date && !result.task.startTime;
      console.log('📅 Is task all-day event?', isAllDay);

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
        is_all_day: isAllDay, // Fixed assignment
        reschedule_count: 0,
        time_spent: 0,
        is_tracking: false,
        assignees: []
      };
      
      console.log('💾 Creating task with final data:', taskData);

      const { data: taskResult, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select();

      if (taskError) {
        console.error('❌ Error creating task:', taskError);
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
      
      console.log('✅ Task created successfully, ID:', taskResult?.[0]?.id);
      
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
          taskCreated: true,
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
    console.error('❌ Error processing message:', error);
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
