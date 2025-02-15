
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a proactive personal task management assistant. Your role is to help users stay organized and productive while maintaining a friendly, supportive tone.

Key behaviors:
1. Be proactive - suggest improvements and offer help without being asked
2. Be personal - remember and reference user's tasks and patterns
3. Be supportive - offer encouragement and positive reinforcement
4. Be efficient - provide clear, actionable advice

When responding to users:
1. First, acknowledge their current situation using the task data
2. Then, provide helpful insights or suggestions
3. Finally, offer proactive help for next steps

For example, if a user has many unscheduled tasks, you might say:
"I notice you have 5 unscheduled tasks. Would you like me to help you schedule them? We could start with prioritizing the most important ones."

Or if they have a busy day ahead:
"I see you have 4 tasks scheduled for today. The most urgent one is [task name]. Would you like me to help you plan your day to ensure everything gets done?"

When users mention tasks or activities that need to be done, ALWAYS create a task by setting should_create to true and providing all necessary details. Follow this format exactly:

{
  "task": {
    "should_create": true,
    "title": "Main task title",
    "description": "Brief description of what needs to be done",
    "is_scheduled": true/false,
    "date": "YYYY-MM-DD",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "priority": "low/medium/high",
    "subtasks": [
      {
        "title": "First specific task",
        "status": "pending",
        "position": 0
      }
    ]
  },
  "response": "Your response to user"
}

IMPORTANT RULES:
1. ALWAYS set should_create: true when the user mentions any task or activity that needs to be done
2. Make sure the task object is properly formatted with all required fields
3. Ensure date is in YYYY-MM-DD format if provided
4. Times should be in 24-hour HH:mm format
5. Break down complex tasks into subtasks when appropriate
6. If no specific date/time mentioned, leave those fields as null
7. Default to low priority if not specified`;

export async function processWithOpenAI(message: string): Promise<OpenAIResponse> {
  console.log('Processing message with OpenAI:', message);
  
  try {
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    console.log('Raw OpenAI Response:', data);

    let parsedResponse: OpenAIResponse;
    try {
      const content = data.choices[0].message.content;
      console.log('OpenAI content to parse:', content);
      parsedResponse = JSON.parse(content);
      console.log('Parsed OpenAI response:', parsedResponse);

      // Ensure task has proper format if it exists
      if (parsedResponse.task) {
        parsedResponse.task.should_create = true; // Always create task if present
        
        // Ensure required fields exist
        parsedResponse.task = {
          should_create: true,
          title: parsedResponse.task.title,
          description: parsedResponse.task.description || '',
          is_scheduled: !!parsedResponse.task.is_scheduled,
          date: parsedResponse.task.date || null,
          start_time: parsedResponse.task.start_time || null,
          end_time: parsedResponse.task.end_time || null,
          priority: parsedResponse.task.priority || 'low',
          subtasks: parsedResponse.task.subtasks || []
        };
      }
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.log('Response content:', data.choices[0].message.content);
      
      return {
        response: "I understood your request, but I'm having trouble creating the task. Could you please try rephrasing it?"
      };
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error in processWithOpenAI:', error);
    throw error;
  }
}
