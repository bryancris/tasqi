import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize the Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export const processChatWithOpenAI = async (message: string, userId: string, previousMessages: any[] = []) => {
  try {
    console.log('Processing chat with OpenAI:', message);
    
    // Fetch relevant context from previous chat messages
    const { data: contextMessages, error: contextError } = await supabase
      .rpc('match_chat_messages', {
        query_embedding: message, // We're cheating here using raw text - ideally this would be vectorized
        match_threshold: 0.5,
        match_count: 5,
        user_id: userId
      });
      
    if (contextError) {
      console.error('Error fetching context:', contextError);
    }
    
    const contextText = contextMessages && contextMessages.length > 0
      ? `Previous relevant messages:\n${contextMessages.map((m: any) => 
        `${m.is_ai ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}`
      : '';
    
    // Build messages array for the completion API
    const systemMessage = {
      role: 'system',
      content: `You are Tasqi, a friendly AI assistant for a task management application. 
      Help the user organize their day, schedule tasks, and manage their to-do list.
      
      When the user asks to create a task or mentions anything that sounds like a task, extract the relevant details and respond helpfully.
      
      For scheduling tasks:
      1. Pay special attention to dates and times. Parse dates like YYYY-MM-DD.
      2. When the user mentions "tomorrow", "next week", or other relative dates, calculate the actual date correctly.
      3. For "tomorrow", use the date that is exactly one day after the current date.
      4. For "next week", use a date 7 days in the future.
      5. Handle both 12-hour format (3:00 PM) and 24-hour format (15:00).
      
      Important date handling:
      - Current date: ${new Date().toISOString().split('T')[0]}
      - "Today" refers to: ${new Date().toISOString().split('T')[0]}
      - "Tomorrow" refers to: ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
      - "Next week" starts on: ${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
      
      Be conversational and helpful. Acknowledge the user's requests and confirm details.
      ${contextText}`
    };
    
    const userMessage = { role: 'user', content: message };
    
    const messages = [
      systemMessage,
      ...previousMessages.slice(-5),
      userMessage
    ];
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('OpenAI response:', aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error('Error processing chat with OpenAI:', error);
    throw error;
  }
};

export const openaiCompletion = async (message: string, context: string): Promise<string> => {
  try {
    return await processChatWithOpenAI(message, '', []);
  } catch (error) {
    console.error('Error with OpenAI completion:', error);
    return "I'm having trouble understanding that right now. Can you try again?";
  }
};

/**
 * Determines if a message is likely a task creation request
 */
export function isTaskCreationRequest(message: string): boolean {
  // Convert to lowercase for easier matching
  const lowerMessage = message.toLowerCase();
  
  // Task-related keywords
  const taskKeywords = ['task', 'todo', 'to-do', 'to do', 'reminder', 'schedule', 'appointment'];
  const hasTaskKeyword = taskKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Action verbs that suggest creating something
  const actionVerbs = ['add', 'create', 'make', 'set', 'schedule', 'remind'];
  const hasActionVerb = actionVerbs.some(verb => lowerMessage.includes(verb));
  
  // Time indicators suggest it's a task with a specific time
  const timeIndicators = ['today', 'tomorrow', 'next week', 'on monday', 'on tuesday', 'on wednesday', 
                         'on thursday', 'on friday', 'on saturday', 'on sunday'];
  const hasTimeIndicator = timeIndicators.some(indicator => lowerMessage.includes(indicator));
  
  // Check for query keywords which would indicate a question rather than a task creation
  const queryPhrases = ['how many', 'what are', 'list', 'show me', 'tell me about', 'what is', 'what\'s'];
  const isQuery = queryPhrases.some(phrase => lowerMessage.includes(phrase));
  
  // If it's a query, it's not a task creation
  if (isQuery) return false;
  
  // Different criteria combinations that suggest a task creation
  const criteria1 = hasActionVerb && hasTaskKeyword;
  const criteria2 = hasTaskKeyword && hasTimeIndicator;
  const criteria3 = hasActionVerb && hasTimeIndicator && message.length > 10;
  
  return criteria1 || criteria2 || criteria3;
}
