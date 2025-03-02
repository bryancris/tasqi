
import { corsHeaders } from '../_shared/cors.ts';
import { ChatMessage, ChatBody, ChatResponse } from "./types.ts";
import { createClient } from '@supabase/supabase-js';
import { interpretDateExpression, getTodaysDate, getTomorrowsDate } from './dateUtils.ts';
import { openAIChatCompletion } from './openaiUtils.ts';
import { createTask, getTaskCountForDate, getUnscheduledTaskCount, getTaskDetailsForDate } from './taskUtils.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Timer-related patterns for intent detection
const timerPatterns = [
  /set (?:a |an )?timer for (\d+) (second|minute|hour|min|sec|hr)s?/i,
  /remind me in (\d+) (second|minute|hour|min|sec|hr)s?/i,
  /timer for (\d+) (second|minute|hour|min|sec|hr)s?/i,
  /alert me in (\d+) (second|minute|hour|min|sec|hr)s?/i,
  /countdown (?:for |of )?(\d+) (second|minute|hour|min|sec|hr)s?/i
];

const cancelTimerPatterns = [
  /cancel (?:the |my |all )?timer/i,
  /stop (?:the |my |all )?timer/i,
  /delete (?:the |my |all )?timer/i
];

const checkTimerPatterns = [
  /how much time (?:is left|remains|do I have left)?/i,
  /check (?:the |my )?timer/i,
  /timer status/i,
  /time left/i
];

// Convert time units to seconds
function getSecondsFromUnit(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase();
  if (normalizedUnit === 'second' || normalizedUnit === 'sec') {
    return value;
  } else if (normalizedUnit === 'minute' || normalizedUnit === 'min') {
    return value * 60;
  } else if (normalizedUnit === 'hour' || normalizedUnit === 'hr') {
    return value * 60 * 60;
  }
  return value * 60; // Default to minutes
}

// Function to create a timer
async function createTimer(userId: string, durationSeconds: number, label?: string): Promise<{ id: number, expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);
  
  // Insert the timer into the database
  const { data, error } = await supabase
    .from('timer_sessions')
    .insert({
      user_id: userId,
      label: label || null,
      duration_seconds: durationSeconds,
      expires_at: expiresAt.toISOString(),
      is_active: true
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating timer:', error);
    throw new Error('Failed to create timer.');
  }
  
  return { id: data.id, expiresAt };
}

// Function to cancel active timers
async function cancelTimers(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .select('id');
  
  if (error) {
    console.error('Error canceling timers:', error);
    throw new Error('Failed to cancel timers.');
  }
  
  return data?.length || 0;
}

// Function to check active timers
async function getActiveTimers(userId: string): Promise<{
  hasTimer: boolean,
  timeRemaining?: string,
  label?: string
}> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: true })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error('Error checking timers:', error);
    throw new Error('Failed to check timer status.');
  }
  
  if (!data) {
    return { hasTimer: false };
  }
  
  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  const timeDiffMs = expiresAt.getTime() - now.getTime();
  
  if (timeDiffMs <= 0) {
    // Timer has expired but not yet processed
    return { hasTimer: false };
  }
  
  // Format the remaining time
  const seconds = Math.floor((timeDiffMs / 1000) % 60);
  const minutes = Math.floor((timeDiffMs / (1000 * 60)) % 60);
  const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
  
  let timeRemaining = '';
  if (hours > 0) {
    timeRemaining += `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    if (timeRemaining) timeRemaining += ' ';
    timeRemaining += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (seconds > 0 || timeRemaining === '') {
    if (timeRemaining) timeRemaining += ' ';
    timeRemaining += `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  
  return { 
    hasTimer: true, 
    timeRemaining,
    label: data.label 
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const body: ChatBody = await req.json();
    const { message, userId } = body;

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Store the user message
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: message,
        is_ai: false
      });

    if (insertError) {
      console.error('Error storing user message:', insertError);
      throw new Error('Failed to store user message');
    }

    // Process message for AI response
    let aiResponse: string;
    let shouldStoreResponse = true;

    // First, check if this is a timer-related request
    let timerMatch = null;
    for (const pattern of timerPatterns) {
      timerMatch = message.match(pattern);
      if (timerMatch) break;
    }

    if (timerMatch) {
      // This is a timer request
      const value = parseInt(timerMatch[1], 10);
      const unit = timerMatch[2];
      const durationSeconds = getSecondsFromUnit(value, unit);
      
      // Extract potential label after "for" or "called"
      let label = null;
      const labelMatch = message.match(/(?:called|named|labeled|for) ['""]?([^'""]+)['""]?/i);
      if (labelMatch) {
        label = labelMatch[1].trim();
      }
      
      try {
        const timer = await createTimer(userId, durationSeconds, label);
        
        // Format expiration time
        const expiresAt = new Date(timer.expiresAt);
        const formattedTime = expiresAt.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        if (label) {
          aiResponse = `I've set a timer for ${value} ${unit}${value !== 1 ? 's' : ''} labeled "${label}". I'll notify you at ${formattedTime}.`;
        } else {
          aiResponse = `I've set a timer for ${value} ${unit}${value !== 1 ? 's' : ''}. I'll notify you at ${formattedTime}.`;
        }
      } catch (error) {
        console.error('Timer creation error:', error);
        aiResponse = `I'm sorry, I couldn't set the timer. Please try again.`;
      }
    } else if (cancelTimerPatterns.some(pattern => pattern.test(message))) {
      // This is a cancel timer request
      try {
        const canceledCount = await cancelTimers(userId);
        if (canceledCount > 0) {
          aiResponse = `I've canceled ${canceledCount} active timer${canceledCount > 1 ? 's' : ''}.`;
        } else {
          aiResponse = `You don't have any active timers to cancel.`;
        }
      } catch (error) {
        console.error('Timer cancellation error:', error);
        aiResponse = `I'm sorry, I couldn't cancel the timer. Please try again.`;
      }
    } else if (checkTimerPatterns.some(pattern => pattern.test(message))) {
      // This is a check timer status request
      try {
        const timerStatus = await getActiveTimers(userId);
        if (timerStatus.hasTimer) {
          if (timerStatus.label) {
            aiResponse = `Your timer "${timerStatus.label}" has ${timerStatus.timeRemaining} remaining.`;
          } else {
            aiResponse = `Your timer has ${timerStatus.timeRemaining} remaining.`;
          }
        } else {
          aiResponse = `You don't have any active timers right now.`;
        }
      } catch (error) {
        console.error('Timer status check error:', error);
        aiResponse = `I'm sorry, I couldn't check your timer status. Please try again.`;
      }
    } else {
      // Process for task-related or general queries
      // Try to detect date expressions
      const dateMatch = interpretDateExpression(message);
      
      // Try to detect task creation intent
      const createTaskMatch = message.match(/create|add|make|set up|schedule|remind me to/i);
      
      // Try to detect task list query intent
      const taskCountMatch = message.match(/how many tasks|number of tasks|task count|tasks do I have/i);
      
      // Try to detect schedule query intent
      const scheduleMatch = message.match(/what do I have|what's on|what is on|show me my|schedule for/i);
      
      // Try to detect unscheduled tasks query
      const unscheduledMatch = message.match(/unscheduled|not scheduled|without dates?|no dates?/i);
      
      if (createTaskMatch) {
        // Task creation request
        const result = await createTask(message, userId);
        aiResponse = result.response;
      } 
      else if (taskCountMatch) {
        if (unscheduledMatch) {
          // Query for unscheduled task count
          const count = await getUnscheduledTaskCount(userId);
          if (count === 0) {
            aiResponse = "You don't have any unscheduled tasks at the moment.";
          } else {
            aiResponse = `You have ${count} unscheduled task${count === 1 ? '' : 's'}.`;
          }
        } else {
          // Query for scheduled task count for a date
          let targetDate = getTodaysDate();
          if (dateMatch) {
            targetDate = dateMatch;
          }
          
          const isToday = targetDate === getTodaysDate();
          const isTomorrow = targetDate === getTomorrowsDate();
          
          const count = await getTaskCountForDate(userId, targetDate);
          if (count === 0) {
            aiResponse = `You have no tasks scheduled for ${isToday ? 'today' : isTomorrow ? 'tomorrow' : targetDate}.`;
          } else {
            aiResponse = `You have ${count} task${count === 1 ? '' : 's'} scheduled for ${isToday ? 'today' : isTomorrow ? 'tomorrow' : targetDate}.`;
          }
        }
      }
      else if (scheduleMatch) {
        // Query for detailed task list for a date
        let targetDate = getTodaysDate();
        if (dateMatch) {
          targetDate = dateMatch;
        }
        
        const isToday = targetDate === getTodaysDate();
        const isTomorrow = targetDate === getTomorrowsDate();
        
        const taskDetails = await getTaskDetailsForDate(userId, targetDate);
        const taskCount = taskDetails.length;
        
        if (taskCount === 0) {
          aiResponse = `You have no tasks scheduled for ${isToday ? 'today' : isTomorrow ? 'tomorrow' : targetDate}. Your day is free!`;
        } else {
          let details = taskDetails.map((task, index) => {
            let time = task.start_time ? ` at ${task.start_time}` : '';
            return `${index + 1}. ${task.title}${time}`;
          }).join('\n');
          
          aiResponse = `Here's what you have scheduled for ${isToday ? 'today' : isTomorrow ? 'tomorrow' : targetDate}:\n\n${details}`;
          
          // Also get unscheduled task count
          const unscheduledCount = await getUnscheduledTaskCount(userId);
          if (unscheduledCount > 0) {
            aiResponse += `\n\nYou also have ${unscheduledCount} unscheduled task${unscheduledCount === 1 ? '' : 's'}.`;
          }
        }
      }
      else {
        // General conversation
        const chatResponse = await openAIChatCompletion(message);
        if (chatResponse) {
          aiResponse = chatResponse;
        } else {
          aiResponse = "I'm sorry, I couldn't process that request. How else can I assist you?";
        }
      }
    }

    // Store the AI response
    if (shouldStoreResponse) {
      const { error: responseError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          content: aiResponse,
          is_ai: true
        });

      if (responseError) {
        console.error('Error storing AI response:', responseError);
      }
    }

    // Return response
    const response: ChatResponse = {
      response: aiResponse
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  }
});
