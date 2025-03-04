
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { toast } from "sonner";

export function useChatSubmission(
  addUserMessage: (content: string) => Message,
  setMessage: (message: string) => void,
  setIsLoading: (isLoading: boolean) => void,
  addLoadingMessage: () => void,
  processMessage: (userMessage: Message) => Promise<{ response?: string; timer?: any; taskCreated?: boolean; task?: any }>,
  removeLastMessage: () => void,
  addAIMessage: (content: string) => Message,
  handleTimerResponse: (timerData: any) => Promise<void>,
  handleTimerRelatedResponse: (response: string) => Promise<void>,
  refreshLists: () => Promise<void>,
  toast: any // Keep the original toast for backward compatibility but ignore it
) {
  const { showNotification } = useNotifications();

  return useCallback(async (e: React.FormEvent, message: string) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = addUserMessage(message);
    setMessage("");
    setIsLoading(true);
    
    // Store information about timer detection to prevent duplicate processing
    let timerDetectedInMessage = false;
    let timerDuration = 0;
    let timerUnit = '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to send messages");
        return;
      }

      // Add a loading indicator message while waiting for response
      addLoadingMessage();

      // Check for timer commands in the user message before sending to the server
      const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
      const match = message.match(timerRegex);
      
      if (match && navigator.onLine) {
        // Store that we've detected a timer in the message to prevent duplicate notifications
        timerDetectedInMessage = true;
        timerDuration = parseInt(match[1]);
        timerUnit = match[2].toLowerCase();
        
        try {
          const data = await processMessage(userMessage);
          
          // Remove the loading indicator message
          removeLastMessage();
          
          // Add the AI's response
          if (data?.response) {
            addAIMessage(data.response);
          } else {
            addAIMessage("I'm sorry, I couldn't process that request.");
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
        } catch (fetchError) {
          console.error('Error with server, using client-side timer fallback:', fetchError);
          
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
        }
      } else {
        // If the message doesn't match timer regex or we're offline, use regular flow
        try {
          // Handle the case when we're offline but not a timer request
          if (!navigator.onLine) {
            removeLastMessage();
            addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
            return;
          }
          
          console.log('🚀 Processing message in chat submission:', message);
          const data = await processMessage(userMessage);
          console.log('📊 Response data:', data);
          
          // Remove the loading indicator message
          removeLastMessage();
          
          // Add the AI's response
          if (data?.response) {
            addAIMessage(data.response);
            
            // If there's a task created by the AI, ensure we show the proper notification
            if (data.taskCreated && data.task) {
              console.log('✅ Task created in chat submission:', data.task);
              toast.success("Task created successfully!");
            }
          } else {
            addAIMessage("I'm sorry, I couldn't process that request.");
          }
          
          // Handle timer-related response
          if (data?.timer) {
            console.log('⏰ Timer data received:', data.timer);
            
            // Use setTimeout with increasing delays to prevent UI blocking
            setTimeout(() => {
              void handleTimerResponse(data.timer);
            }, 200);
          } 
          // Only check for timer phrases if we didn't explicitly detect a timer command in the original message
          else if (data?.response && !timerDetectedInMessage) {
            setTimeout(() => {
              void handleTimerRelatedResponse(data.response!);
            }, 500);
          }
          
          // Refresh tasks and notifications with longer delay
          setTimeout(() => {
            void refreshLists();
          }, 1500);
        } catch (err) {
          // Error occurred, but wasn't a timer request
          console.error('Error processing message:', err);
          removeLastMessage();
          addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
          toast.error("Failed to process message. Please try again.");
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      removeLastMessage(); // Make sure to remove loading indicator if it exists
      addAIMessage("Sorry, I encountered an error processing your message. Please try again later.");
      toast.error("Failed to process message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [addUserMessage, setMessage, setIsLoading, addLoadingMessage, processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists, showNotification]);
}
