
import { useQueryClient } from "@tanstack/react-query";

export interface TimerData {
  action: string;
  label: string;
  duration: number;
  unit: string;
  milliseconds: number;
}

export function useTimerDetection() {
  const queryClient = useQueryClient();

  // Try to detect if we're setting a timer
  const detectTimerRequest = (content: string): { 
    timerMatch: boolean; 
    duration?: number; 
    unit?: string;
  } => {
    const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
    const match = content.match(timerRegex);
    
    if (match) {
      const duration = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      return {
        timerMatch: true,
        duration,
        unit
      };
    }
    
    return { timerMatch: false };
  };
  
  // Create a client-side timer response when server fails
  const createClientSideTimerResponse = (duration: number, unit: string): { 
    response: string;
    timer: TimerData;
  } => {
    // Calculate milliseconds properly based on the unit
    let milliseconds = 0;
    if (unit.startsWith('sec')) milliseconds = duration * 1000;
    else if (unit.startsWith('min')) milliseconds = duration * 60 * 1000;
    else if (unit.startsWith('hour')) milliseconds = duration * 60 * 60 * 1000;
    
    const timerLabel = `${duration} ${unit}${duration > 1 && !unit.endsWith('s') ? 's' : ''}`;
    
    // Double-check the milliseconds calculation
    console.log(`⏱️ Client timer calculation: ${timerLabel} = ${milliseconds}ms`);
    
    // Construct timer response message
    let timerResponse;
    if (unit.startsWith('sec')) {
      timerResponse = `I've set a ${duration} second timer for you.`;
    } else if (unit.startsWith('min')) {
      timerResponse = `I've set a ${duration} minute timer for you.`;
    } else if (unit.startsWith('hour')) {
      timerResponse = `I've set a ${duration} hour timer for you.`;
    }
    
    return {
      response: timerResponse!,
      timer: {
        action: 'created',
        label: timerLabel,
        duration: duration,
        unit: unit,
        milliseconds: milliseconds
      }
    };
  };
  
  // Refresh timer data
  const refreshTimerData = () => {
    // Force immediate refresh of timer data, but with delay to prevent UI blocking
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['timers'] });
    }, 300);
  };

  return {
    detectTimerRequest,
    createClientSideTimerResponse,
    refreshTimerData
  };
}
