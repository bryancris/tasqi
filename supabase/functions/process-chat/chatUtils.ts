
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

  // Regex patterns for timer creation
  const timerPatterns = [
    /set (?:a |an |)timer for (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
    /remind me in (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
    /start (?:a |an |)timer for (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
    /timer for (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
    /start countdown for (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
    /set (?:a |an |)reminder for (\d+) (minute|minutes|min|mins|hour|hours|hr|hrs)/i,
  ];

  for (const pattern of timerPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const duration = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      // Convert to minutes if specified in hours
      let minutes = duration;
      if (unit.startsWith('hour') || unit === 'hr' || unit === 'hrs') {
        minutes = duration * 60;
      }

      // Try to extract an optional label (ex: "set a timer for 5 minutes for my pasta")
      let label = null;
      const labelMatch = lowerMessage.match(/for (.+?)(?:$|\.)/i);
      if (labelMatch && !labelMatch[1].includes('minute') && !labelMatch[1].includes('hour') && !labelMatch[1].includes('min') && !labelMatch[1].includes('hr')) {
        label = labelMatch[1].trim();
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
