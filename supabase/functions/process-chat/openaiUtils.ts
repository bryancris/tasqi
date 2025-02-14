
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a task scheduling assistant. When a user mentions something that sounds like a task:

1. First, determine if this is a task that could benefit from being broken down into subtasks. Consider the following:
   - Tasks involving multiple people or assignments
   - Tasks with sequential steps
   - Tasks that can be naturally divided into smaller components
   If yes, either create subtasks automatically or ask the user if they'd like you to break it down.

2. For task completion:
   - If they are telling you they completed a task, mark it as completed and extract EXACTLY the task title they mentioned

3. For scheduling:
   - If it has a specific time/date, create it as a scheduled task
   - If no specific time/date is mentioned, create it as an unscheduled task

4. For tasks involving multiple people or items (like in "three charts ones for Brian ones from Mike ones for David"):
   - Create appropriate subtasks for each person/item
   - Make the main task title clear and descriptive
   - Each subtask should be specific to one person/item

5. Other important rules:
   - Always extract as much detail as possible
   - Always set priority to "low" unless specifically mentioned
   - For scheduled tasks, ALWAYS return time in HH:mm format (24-hour)
   - Only include time fields if explicitly mentioned

6. For dates, understand and convert relative terms:
   - "today" → return literal string "today"
   - "tomorrow" → return literal string "tomorrow"
   - "next week" → return literal string "next week"
   - "next month" → return literal string "next month"
   DO NOT return placeholders like <YYYY-MM-DD>

7. For subtasks:
   - Each subtask must have a clear, specific title
   - Status is always initially "pending"
   - Position is determined by the order mentioned (0-based index)
   - If unsure about subtasks but the task seems complex, ask the user if they'd like it broken down

Example of good subtask creation:
User: "three charts ones for Brian ones from Mike ones for David"
Response should create:
- Main task: "Create charts for team members"
- Subtasks: 
  1. "Create chart for Brian"
  2. "Process chart from Mike"
  3. "Create chart for David"

Return JSON in this format:
{
  "task": {
    "should_create": true/false,
    "should_complete": true/false,
    "task_title": "Title of task to complete",
    "title": "Task title",
    "description": "Optional description",
    "is_scheduled": true/false,
    "date": "today/tomorrow/next week/next month",
    "start_time": "HH:mm",
    "end_time": "HH:mm",
    "priority": "low"/"medium"/"high",
    "subtasks": [
      {
        "title": "Specific subtask title",
        "status": "pending",
        "position": 0
      }
    ]
  },
  "response": "Your friendly response to the user. If you're unsure about subtasks but think they might be helpful, ask the user if they'd like the task broken down."
}`;

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
    // Validate that we have a response with choices
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    let parsedResponse: OpenAIResponse;
    try {
      parsedResponse = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.log('Response content:', data.choices[0].message.content);
      
      // If JSON parsing fails, create a fallback response
      return {
        task: {
          should_create: false,
          title: "",
          is_scheduled: false
        },
        response: "I'm sorry, but I couldn't process that request properly. Could you please rephrase it?"
      };
    }

    // Validate the parsed response structure
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      throw new Error('Invalid response structure');
    }

    if (!parsedResponse.response || typeof parsedResponse.response !== 'string') {
      throw new Error('Missing or invalid response field');
    }

    if (parsedResponse.task) {
      // Validate task fields if present
      if (typeof parsedResponse.task.should_create !== 'boolean') {
        throw new Error('Invalid task.should_create field');
      }

      if (parsedResponse.task.should_create) {
        if (!parsedResponse.task.title || typeof parsedResponse.task.title !== 'string') {
          throw new Error('Missing or invalid task.title field');
        }

        if (typeof parsedResponse.task.is_scheduled !== 'boolean') {
          throw new Error('Invalid task.is_scheduled field');
        }
      }

      // Add end time if start time is present but end time is missing
      if (parsedResponse.task.is_scheduled && 
          parsedResponse.task.start_time && 
          !parsedResponse.task.end_time) {
        const [hours, minutes] = parsedResponse.task.start_time.split(':').map(Number);
        const endHour = (hours + 1) % 24;
        parsedResponse.task.end_time = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        console.log('Added default end time:', parsedResponse.task.end_time);
      }

      // Ensure subtasks array exists and has valid structure
      if (parsedResponse.task.subtasks) {
        parsedResponse.task.subtasks = parsedResponse.task.subtasks.map((subtask: any, index: number) => ({
          title: subtask.title,
          status: 'pending',
          position: index
        }));
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error validating OpenAI response:', error);
    console.error('Response data:', data);
    throw new Error(`Failed to validate OpenAI response: ${error.message}`);
  }
}
