
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a task management assistant. Your role is to help users manage their tasks and subtasks.

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

For example:
User: "when I get home I need to take out the garbage and walk the dog send images and then I need to exercise"
You should respond with:
{
  "task": {
    "should_create": true,
    "title": "Evening Tasks at Home",
    "description": "Tasks to complete after arriving home",
    "is_scheduled": true,
    "date": "today",
    "subtasks": [
      {
        "title": "Take out the garbage",
        "status": "pending",
        "position": 0
      },
      {
        "title": "Walk the dog",
        "status": "pending",
        "position": 1
      },
      {
        "title": "Send images",
        "status": "pending",
        "position": 2
      },
      {
        "title": "Exercise",
        "status": "pending",
        "position": 3
      }
    ]
  },
  "response": "I've created your evening task list with all activities as subtasks. They will be checked off as you complete them."
}

Remember:
1. ALWAYS create subtasks when multiple items are mentioned
2. Use clear, action-oriented language for subtask titles
3. Keep responses concise and focused
4. Set is_scheduled to true when time-related words are mentioned (today, tomorrow, after, when, etc.)
5. Include relevant dates when mentioned
6. Never combine multiple distinct actions into a single subtask
7. Always break down tasks when words like "and", "then", or commas are used to separate activities`;

export async function processWithOpenAI(message: string): Promise<OpenAIResponse> {
  console.log('Processing message with OpenAI:', message);
  
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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

    // Transform subtasks if they exist
    if (parsedResponse.task?.subtasks) {
      console.log('Processing subtasks:', parsedResponse.task.subtasks);
      parsedResponse.task.subtasks = parsedResponse.task.subtasks.map((subtask: any, index: number) => ({
        title: subtask.title,
        status: 'pending' as const,
        position: index
      }));
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    throw error;
  }
}
