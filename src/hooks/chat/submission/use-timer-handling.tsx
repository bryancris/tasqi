
import { useCallback } from "react";
import { Message } from "@/components/chat/types";
import { TimerHandlingHelpers } from "./types";

export function useTimerHandling({
  processMessage,
  removeLastMessage,
  addAIMessage,
  handleTimerResponse,
  handleTimerRelatedResponse,
  refreshLists
}: TimerHandlingHelpers) {
  return useCallback(async (
    userMessage: Message, 
    timerMatch: RegExpMatchArray
  ): Promise<{ handled: boolean }> => {
    const timerDuration = parseInt(timerMatch[1]);
    const timerUnit = timerMatch[2].toLowerCase();
    
    try {
      console.log('⏰ Timer detected, processing message...');
      const data = await processMessage(userMessage);
      console.log('⏰ Timer response received:', data);
      
      // Remove the loading indicator message
      removeLastMessage();
      
      // Add the AI's response
      if (data?.response) {
        addAIMessage(data.response);
        
        // Dispatch success response event (important for mobile)
        window.dispatchEvent(new CustomEvent('ai-response', { 
          detail: { success: true, timer: data.timer }
        }));
      } else {
        addAIMessage("I'm sorry, I couldn't process that request.");
        
        // Dispatch generic success event
        window.dispatchEvent(new CustomEvent('ai-response', { 
          detail: { success: true }
        }));
      }
      
      // Handle timer-related response in a non-blocking way
      if (data?.timer) {
        console.log('⏰ Timer data received:', data.timer);
        
        // Use a small delay before handling timer to prevent UI blocking
        setTimeout(() => {
          void handleTimerResponse(data.timer);
        }, 100);
      } 
      
      // Refresh lists after a longer delay
      setTimeout(() => {
        void refreshLists();
      }, 1000);
      
      return { handled: true };
    } catch (fetchError) {
      console.error('❌ Error with server, using client-side timer fallback:', fetchError);
      
      // Remove the loading indicator message
      removeLastMessage();
      
      // Create a timer locally when server can't be reached
      let milliseconds = 0;
      if (timerUnit.startsWith('sec')) milliseconds = timerDuration * 1000;
      else if (timerUnit.startsWith('min')) milliseconds = timerDuration * 60 * 1000;
      else if (timerUnit.startsWith('hour')) milliseconds = timerDuration * 60 * 60 * 1000;
      
      // Verify the calculation is correct
      console.log(`⏱️ Creating client-side timer: ${timerDuration} ${timerUnit} = ${milliseconds}ms`);
      
      const timerLabel = `${timerDuration} ${timerUnit}${timerDuration > 1 && !timerUnit.endsWith('s') ? 's' : ''}`;
      
      // Add a success message
      addAIMessage(`I've set a timer for ${timerLabel}.`);
      
      // Handle the timer in a controlled way
      setTimeout(() => {
        void handleTimerResponse({
          action: 'created',
          label: timerLabel,
          duration: timerDuration,
          unit: timerUnit,
          milliseconds: milliseconds
        });
      }, 200);
      
      // Dispatch success response event (important for mobile)
      window.dispatchEvent(new CustomEvent('ai-response', { 
        detail: { success: true, timerFallback: true }
      }));
      
      return { handled: true };
    }
  }, [processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists]);
}
