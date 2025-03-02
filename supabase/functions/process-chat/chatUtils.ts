
import { TimerIntent, TimerActionResult } from "./types.ts";
import { differenceInMinutes, parseISO, formatDistanceToNow } from "./dateUtils.ts";

/**
 * Parse a user message to detect timer intents
 */
export function parseTimerIntent(message: string): TimerIntent | null {
  // Convert to lowercase for easier matching
  const lowerMessage = message.toLowerCase();

  // Check for cancel timer intent
  if (
    lowerMessage.includes('cancel timer') || 
    lowerMessage.includes('stop timer') ||
    lowerMessage.includes('turn off timer')
  ) {
    return {
      action: 'cancel'
    };
  }

  // Check for timer status check intent
  if (
    lowerMessage.includes('check timer') || 
    lowerMessage.includes('how much time') ||
    lowerMessage.includes('timer status') ||
    lowerMessage.includes('time left')
  ) {
    return {
      action: 'check'
    };
  }

  // Improved regex patterns for timer creation with more variations
  // Match more conversational patterns like "set a 1 min timer please"
  const minutesPattern = /(\d+)\s*(minute|minutes|min|mins)/i;
  const hoursPattern = /(\d+)\s*(hour|hours|hr|hrs)/i;
  
  let minutes = 0;
  let label = null;
  
  // Check if message contains "timer" or "remind" keywords
  const isTimerRequest = lowerMessage.includes('timer') || 
                         lowerMessage.includes('remind') || 
                         lowerMessage.includes('alert') ||
                         lowerMessage.includes('notification');
  
  if (isTimerRequest) {
    // Try to extract minutes
    const minutesMatch = lowerMessage.match(minutesPattern);
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }
    
    // Try to extract hours
    const hoursMatch = lowerMessage.match(hoursPattern);
    if (hoursMatch) {
      minutes += parseInt(hoursMatch[1], 10) * 60;
    }
    
    // If we found a time duration
    if (minutes > 0) {
      // Try to extract an optional label
      // Look for phrases after "for", "about", "to", etc.
      const labelPatterns = [
        /for\s+([^.!?]+?)(?:$|\.|\!|\?|in\s+\d+)/i,
        /about\s+([^.!?]+?)(?:$|\.|\!|\?|in\s+\d+)/i,
        /to\s+([^.!?]+?)(?:$|\.|\!|\?|in\s+\d+)/i
      ];
      
      for (const pattern of labelPatterns) {
        const labelMatch = lowerMessage.match(pattern);
        if (labelMatch && !labelMatch[1].includes('minute') && !labelMatch[1].includes('hour') && 
            !labelMatch[1].includes('min') && !labelMatch[1].includes('hr')) {
          label = labelMatch[1].trim();
          break;
        }
      }
      
      return {
        action: 'create',
        minutes,
        label
      };
    }
  }

  return null;
}

/**
 * Cancel active timers for a user
 */
export async function cancelTimer(supabase: any, userId: string): Promise<TimerActionResult> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .select();

  if (error) {
    console.error("Error canceling timer:", error);
    return {
      success: false,
      message: "I had trouble canceling your timer. Please try again."
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: "You don't have any active timers to cancel."
    };
  }

  return {
    success: true,
    message: `I've canceled your timer${data.length > 1 ? 's' : ''}.`
  };
}

/**
 * Check the status of active timers for a user
 */
export async function checkTimerStatus(supabase: any, userId: string): Promise<TimerActionResult> {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: true });

  if (error) {
    console.error("Error checking timer status:", error);
    return {
      success: false,
      message: "I had trouble checking your timer status. Please try again."
    };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: "You don't have any active timers."
    };
  }

  // If multiple timers, give a summary
  if (data.length > 1) {
    return {
      success: true,
      message: `You have ${data.length} active timers. The next one will complete in ${formatDistanceToNow(parseISO(data[0].expires_at))}.`
    };
  }

  // Single timer - give detailed information
  const timer = data[0];
  const now = new Date();
  const expiresAt = parseISO(timer.expires_at);
  const minutesLeft = Math.max(0, differenceInMinutes(expiresAt, now));

  const timeLeftString = minutesLeft <= 1 
    ? "less than a minute" 
    : `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

  const message = timer.label
    ? `Your timer for "${timer.label}" has ${timeLeftString} remaining.`
    : `Your timer has ${timeLeftString} remaining.`;

  return {
    success: true,
    message
  };
}
