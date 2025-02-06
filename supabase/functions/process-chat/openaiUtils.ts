
const SYSTEM_PROMPT = `You are a task scheduling assistant. When a user mentions something that sounds like a task:
1. If it has a specific time/date, create it as a scheduled task
2. If no specific time/date is mentioned, create it as an unscheduled task
3. Always extract as much detail as possible
4. Always set priority to "low" unless specifically mentioned
5. For scheduled tasks, ALWAYS return time in HH:mm format (24-hour)
6. Only include time fields if they are explicitly mentioned
7. For dates, understand and convert relative terms:
   - "today" → return literal string "today"
   - "tomorrow" → return literal string "tomorrow"
   - "next week" → return literal string "next week"
   - "next month" → return literal string "next month"
   DO NOT return placeholders like <YYYY-MM-DD>. The date conversion will happen in the code.

Return JSON in this format:
{
  "task": {
    "should_create": true,
    "title": "Task title",
    "description": "Optional description",
    "is_scheduled": true/false,
    "date": "today/tomorrow/next week/next month",
    "start_time": "HH:mm" (if time specified),
    "end_time": "HH:mm" (if duration specified or add 1 hour to start_time if not specified)
  },
  "response": "Your friendly response to the user"
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
  console.log('OpenAI Response:', data);

  try {
    const parsedResponse = JSON.parse(data.choices[0].message.content) as OpenAIResponse;
    
    // Add end time if start time is present but end time is missing
    if (parsedResponse.task?.is_scheduled && 
        parsedResponse.task.start_time && 
        !parsedResponse.task.end_time) {
      // Parse the start time
      const [hours, minutes] = parsedResponse.task.start_time.split(':').map(Number);
      // Add one hour for end time
      const endHour = (hours + 1) % 24;
      parsedResponse.task.end_time = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      console.log('Added default end time:', parsedResponse.task.end_time);
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse OpenAI response');
  }
}

