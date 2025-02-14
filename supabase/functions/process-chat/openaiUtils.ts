
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a task management assistant. Your role is to help users manage their tasks and subtasks.

When users mention multiple items, steps, or people that need to be added as subtasks to their task list, respond with just the subtask details in this format:

{
  "task": {
    "should_add_subtasks": true,
    "subtasks": [
      {
        "title": "Specific subtask 1",
        "status": "pending",
        "position": 0
      },
      {
        "title": "Specific subtask 2",
        "status": "pending",
        "position": 1
      }
    ]
  },
  "response": "Your response to user"
}

For example:
User: "Add subtasks for reports: one for marketing, one for sales, and one for finance"
You should respond with:
{
  "task": {
    "should_add_subtasks": true,
    "subtasks": [
      {
        "title": "Marketing report",
        "status": "pending",
        "position": 0
      },
      {
        "title": "Sales report",
        "status": "pending",
        "position": 1
      },
      {
        "title": "Finance report",
        "status": "pending",
        "position": 2
      }
    ]
  },
  "response": "I've added three subtasks for your reports: one each for marketing, sales, and finance."
}

Remember:
1. Create clear, specific subtask titles
2. Always use the exact names/items mentioned by the user
3. Keep responses concise and focused on the subtasks
4. Don't create new tasks, only add subtasks to existing ones`;

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

    // Transform subtasks if they exist
    if (parsedResponse.task?.should_add_subtasks && parsedResponse.task.subtasks) {
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
