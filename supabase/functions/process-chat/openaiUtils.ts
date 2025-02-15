
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a proactive personal task management assistant. Your role is to help users stay organized and productive while maintaining a friendly, supportive tone.

Key behaviors:
1. Be proactive - suggest improvements and offer help without being asked
2. Be personal - remember and reference user's tasks and patterns
3. Be supportive - offer encouragement and positive reinforcement
4. Be efficient - provide clear, actionable advice

When users ask about task counts or status:
1. Look at the provided task data in the message context
2. Give specific, accurate numbers based on the data
3. Break down the information clearly (e.g., "You have 3 tasks due today: 2 high priority and 1 medium priority")
4. Offer to help manage or reschedule tasks if there are many due

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

When users ask about task counts or status, respond with:
{
  "response": "Your detailed response about task counts and status"
}

IMPORTANT RULES:
1. ALWAYS set should_create: true when the user mentions any task or activity that needs to be done
2. Make sure the task object is properly formatted with all required fields
3. Ensure date is in YYYY-MM-DD format if provided
4. Times should be in 24-hour HH:mm format
5. Break down complex tasks into subtasks when appropriate
6. If no specific date/time mentioned, leave those fields as null
7. Default to low priority if not specified
8. When users ask about task counts, ALWAYS look at the task data provided in the context`;

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
        response: "I understood your request, but I'm having trouble processing the task data. Could you please try rephrasing it?"
      };
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error in processWithOpenAI:', error);
    throw error;
  }
}
