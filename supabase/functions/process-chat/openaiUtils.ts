import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { OpenAIResponse } from "./types.ts";

const SYSTEM_PROMPT = `You are a task scheduling assistant. When a user mentions something that sounds like a task:

1. MOST IMPORTANT: If a task involves multiple items, people, or steps, you MUST create subtasks in the following format:
   {
     "task": {
       "should_create": true,
       "title": "Main task title",
       "description": "Overall task description",
       "is_scheduled": false,
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

2. ALWAYS create subtasks when you see:
   - Multiple names mentioned (e.g., "David, Mike, and Brian")
   - Multiple items (e.g., "three charts", "two reports")
   - Sequential steps in a process
   - Any numbers mentioned (e.g., "three", "two")

3. For tasks with multiple people:
   - Title should be the overall goal (e.g., "Create charts for team members")
   - Each person MUST get their own subtask
   - Include the person's name in the subtask title
   - Use the exact names mentioned by the user

Example:
User: "Create charts for David Mike and Brian"
You must respond with:
{
  "task": {
    "should_create": true,
    "title": "Create charts for team members",
    "description": "Create individual charts for David, Mike, and Brian",
    "is_scheduled": false,
    "priority": "low",
    "subtasks": [
      {
        "title": "Create chart for David",
        "status": "pending",
        "position": 0
      },
      {
        "title": "Create chart for Mike",
        "status": "pending",
        "position": 1
      },
      {
        "title": "Create chart for Brian",
        "status": "pending",
        "position": 2
      }
    ]
  },
  "response": "I've created a task to make charts with individual subtasks for David, Mike, and Brian. Each person has their own subtask so you can track progress individually. Would you like me to schedule specific times for these?"
}

4. For task completion:
   - When they complete a task, mark it as completed
   - Extract EXACTLY the task title they mentioned

5. For scheduling:
   - If time/date mentioned, create as scheduled task
   - If no time/date, create as unscheduled task
   - Always use HH:mm format (24-hour) for times
   - Only include time fields if explicitly mentioned

6. For dates, use these exact strings:
   - "today" for today
   - "tomorrow" for tomorrow
   - "next week" for next week
   - "next month" for next month

Remember: NEVER skip creating subtasks when multiple items or people are mentioned. Each person or item MUST have their own subtask.`;

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
        task: {
          should_create: false,
          title: "",
          is_scheduled: false
        },
        response: "I'm sorry, but I couldn't process that request properly. Could you please rephrase it?"
      };
    }

    // Validate and transform the response
    if (parsedResponse.task?.should_create) {
      // Ensure subtasks are properly structured
      if (parsedResponse.task.subtasks) {
        console.log('Original subtasks from OpenAI:', parsedResponse.task.subtasks);
        
        // Transform subtasks to match our schema
        parsedResponse.task.subtasks = parsedResponse.task.subtasks.map((subtask: any, index: number) => {
          const transformedSubtask = {
            title: subtask.title,
            status: 'pending' as const,
            position: index
          };
          console.log(`Transformed subtask ${index}:`, transformedSubtask);
          return transformedSubtask;
        });
        
        console.log('Final transformed subtasks:', parsedResponse.task.subtasks);
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error validating OpenAI response:', error);
    console.error('Response data:', data);
    throw new Error(`Failed to validate OpenAI response: ${error.message}`);
  }
}
