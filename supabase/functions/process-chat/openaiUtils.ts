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

When users mention multiple tasks or steps, ALWAYS create a main task with subtasks. Follow this format:

{
  "task": {
    "should_create": true,
    "title": "Main task title that summarizes the overall goal",
    "description": "Brief description of what needs to be done",
    "is_scheduled": true,
    "date": "today",
    "subtasks": [
      {
        "title": "First specific task",
        "status": "pending",
        "position": 0
      },
      {
        "title": "Second specific task",
        "status": "pending",
        "position": 1
      }
    ]
  },
  "response": "Your response to user"
}

Remember to:
1. Be proactive about suggesting task organization
2. Offer specific help based on their task status
3. Provide encouragement and motivation
4. Suggest breaking down complex tasks into subtasks
5. Remind about upcoming tasks when relevant
6. Offer to help prioritize when there are many tasks
7. Suggest scheduling for unscheduled tasks
8. Provide time management tips when appropriate
9. Celebrate task completion and progress
10. Be conversational and friendly while remaining professional`;

export async function processWithOpenAI(message: string): Promise<OpenAIResponse> {
  console.log('Processing message with OpenAI:', message);
  
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

  try {
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let parsedResponse: OpenAIResponse;
    try {
      parsedResponse = JSON.parse(data.choices[0].message.content);
      console.log('Parsed response:', parsedResponse);
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.log('Response content:', data.choices[0].message.content);
      
      return {
        response: "I'm sorry, but I couldn't process that request properly. Could you please rephrase it?"
      };
    }

    // Ensure task has should_create set to true if it has subtasks
    if (parsedResponse.task?.subtasks && parsedResponse.task.subtasks.length > 0) {
      parsedResponse.task.should_create = true;
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    throw error;
  }
}
