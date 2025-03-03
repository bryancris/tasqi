
import { TimerIntent, TimerActionResult } from "./types.ts";

/**
 * Parse a message to detect timer-related intents
 */
export function parseTimerIntent(message: string): TimerIntent | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for timer creation patterns
  const setTimerRegex = /set\s+(?:a|an)?(?:\s*)(?:timer|reminder)(?:\s*)(?:for)?(?:\s*)(\d+)(?:\s*)(second|seconds|sec|secs|minute|minutes|min|mins|hour|hours|hr|hrs)/i;
  const timerForRegex = /timer(?:\s*)(?:for)(?:\s*)(\d+)(?:\s*)(second|seconds|sec|secs|minute|minutes|min|mins|hour|hours|hr|hrs)/i;
  const reminderForRegex = /reminder(?:\s*)(?:for)(?:\s*)(\d+)(?:\s*)(second|seconds|sec|secs|minute|minutes|min|mins|hour|hours|hr|hrs)/i;
  
  // Check for timer cancellation patterns
  const cancelTimerRegex = /(?:cancel|stop|end|delete)(?:\s*)(?:my)?(?:\s*)(?:timer|reminder)/i;
  
  // Check for timer status request patterns
  const checkTimerRegex = /(?:check|status|how\s+much\s+time|how\s+long|time\s+left)(?:\s*)(?:on|for|in)?(?:\s*)(?:my)?(?:\s*)(?:timer|reminder)/i;
  
  let match = setTimerRegex.exec(lowerMessage) || 
              timerForRegex.exec(lowerMessage) || 
              reminderForRegex.exec(lowerMessage);
  
  if (match) {
    let amount = parseInt(match[1], 10);
    let unit = match[2].toLowerCase();
    
    // Normalize time units to minutes
    let minutes = amount;
    if (unit.startsWith('sec')) {
      minutes = Math.max(1, Math.round(amount / 60)); // Minimum 1 minute
    } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
      minutes = amount * 60;
    }
    
    // Extract label if present (anything after the time specification)
    const fullMatchEndIndex = match.index + match[0].length;
    let label = null;
    if (fullMatchEndIndex < lowerMessage.length) {
      const remainingText = message.slice(fullMatchEndIndex).trim();
      if (remainingText) {
        // Remove common phrases like "called", "named", "for", "labeled"
        const cleanedText = remainingText
          .replace(/^(?:called|named|for|labeled|labelled|about|regarding|titled)\s+/i, '')
          .trim();
        
        if (cleanedText) {
          label = cleanedText;
        }
      }
    }
    
    return {
      action: 'create',
      minutes: minutes,
      label: label
    };
  }
  
  // Check for cancel intent
  if (cancelTimerRegex.test(lowerMessage)) {
    return { action: 'cancel' };
  }
  
  // Check for status check intent
  if (checkTimerRegex.test(lowerMessage)) {
    return { action: 'check' };
  }
  
  return null;
}

/**
 * Cancel any active timers for a user
 */
export async function cancelTimer(supabase: any, userId: string): Promise<TimerActionResult> {
  try {
    // Check if user has active timers
    const { data: activeTimers, error: checkError } = await supabase
      .from("timer_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
      
    if (checkError) {
      console.error("Error checking for active timers:", checkError);
      return {
        success: false,
        message: "I couldn't check for active timers. There might be a system issue."
      };
    }
    
    if (!activeTimers || activeTimers.length === 0) {
      return {
        success: false,
        message: "You don't have any active timers to cancel."
      };
    }
    
    // Cancel all active timers
    const { error: updateError } = await supabase
      .from("timer_sessions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("is_active", true);
      
    if (updateError) {
      console.error("Error canceling timers:", updateError);
      return {
        success: false,
        message: "I had trouble canceling your timer. Please try again."
      };
    }
    
    const timerCount = activeTimers.length;
    return {
      success: true,
      message: timerCount === 1 
        ? "I've canceled your timer." 
        : `I've canceled your ${timerCount} active timers.`
    };
  } catch (error) {
    console.error("Exception in cancelTimer:", error);
    return {
      success: false,
      message: "Something went wrong while trying to cancel your timer."
    };
  }
}

/**
 * Check the status of active timers for a user
 */
export async function checkTimerStatus(supabase: any, userId: string): Promise<TimerActionResult> {
  try {
    // Get all active timers for the user
    const { data: activeTimers, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("expires_at", { ascending: true });
      
    if (error) {
      console.error("Error checking timer status:", error);
      return {
        success: false,
        message: "I couldn't check your timer status. There might be a system issue."
      };
    }
    
    if (!activeTimers || activeTimers.length === 0) {
      return {
        success: true,
        message: "You don't have any active timers right now."
      };
    }
    
    if (activeTimers.length === 1) {
      const timer = activeTimers[0];
      const expiresAt = new Date(timer.expires_at);
      const now = new Date();
      
      // Calculate time remaining
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
      
      let timeMessage;
      if (timeRemaining <= 0) {
        timeMessage = "less than a minute";
      } else if (timeRemaining === 1) {
        timeMessage = "1 minute";
      } else if (timeRemaining < 60) {
        timeMessage = `${timeRemaining} minutes`;
      } else {
        const hours = Math.floor(timeRemaining / 60);
        const mins = timeRemaining % 60;
        timeMessage = hours === 1 
          ? `1 hour${mins > 0 ? ` and ${mins} minutes` : ''}` 
          : `${hours} hours${mins > 0 ? ` and ${mins} minutes` : ''}`;
      }
      
      const labelInfo = timer.label ? ` for "${timer.label}"` : '';
      return {
        success: true,
        message: `You have a timer${labelInfo} with ${timeMessage} remaining.`,
        data: activeTimers
      };
    } else {
      // Multiple timers
      const timerMessages = activeTimers.map(timer => {
        const expiresAt = new Date(timer.expires_at);
        const now = new Date();
        const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));
        
        let timeMessage;
        if (timeRemaining <= 0) {
          timeMessage = "less than a minute";
        } else if (timeRemaining === 1) {
          timeMessage = "1 minute";
        } else if (timeRemaining < 60) {
          timeMessage = `${timeRemaining} minutes`;
        } else {
          const hours = Math.floor(timeRemaining / 60);
          const mins = timeRemaining % 60;
          timeMessage = hours === 1 
            ? `1 hour${mins > 0 ? ` and ${mins} minutes` : ''}` 
            : `${hours} hours${mins > 0 ? ` and ${mins} minutes` : ''}`;
        }
        
        return `${timer.label ? `"${timer.label}"` : 'Timer'}: ${timeMessage} remaining`;
      });
      
      return {
        success: true,
        message: `You have ${activeTimers.length} active timers:\n${timerMessages.join('\n')}`,
        data: activeTimers
      };
    }
  } catch (error) {
    console.error("Exception in checkTimerStatus:", error);
    return {
      success: false,
      message: "Something went wrong while checking your timer status."
    };
  }
}
