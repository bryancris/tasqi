
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useNotifications } from "@/components/notifications/NotificationsManager";

export function useChatSubmission(
  addUserMessage: (content: string) => Message,
  setMessage: (message: string) => void,
  setIsLoading: (isLoading: boolean) => void,
  addLoadingMessage: () => void,
  processMessage: (userMessage: Message) => Promise<{ response?: string; timer?: any }>,
  removeLastMessage: () => void,
  addAIMessage: (content: string) => Message,
  handleTimerResponse: (timerData: any) => Promise<void>,
  handleTimerRelatedResponse: (response: string) => Promise<void>,
  refreshLists: () => Promise<void>,
  toast: any
) {
  const { showNotification } = useNotifications();

  return useCallback(async (e: React.FormEvent, message: string) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = addUserMessage(message);
    setMessage("");
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to send messages",
          variant: "destructive",
        });
        return;
      }

      // Add a loading indicator message while waiting for response
      addLoadingMessage();

      // Check for timer commands in the user message before sending to the server
      const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
      const match = message.match(timerRegex);
      
      if (match && navigator.onLine) {
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
          
          // Handle timer-related response in a controlled, non-blocking way
          if (data?.timer) {
            console.log('⏰ Timer data received:', data.timer);
            
            // Use setTimeout to handle timer response asynchronously
            // This prevents UI freezing by not blocking the main thread
            setTimeout(async () => {
              await handleTimerResponse(data.timer);
            }, 100);
            
            // Force immediate update of notifications for timers
            // with timeout to prevent UI blocking
            setTimeout(async () => {
              await refreshLists();
            }, 500);
          } 
          // Still check general timer-related responses for backward compatibility
          else if (data?.response) {
            console.log('🔍 Checking response for timer references:', data.response.substring(0, 50) + '...');
            
            // Handle in non-blocking way
            setTimeout(async () => {
              await handleTimerRelatedResponse(data.response);
            }, 100);
          }
          
          // Refresh tasks and notifications with delay to prevent UI blocking
          setTimeout(async () => {
            await refreshLists();
          }, 1000);
        } catch (fetchError) {
          console.error('Error with server, using client-side timer fallback:', fetchError);
          
          // Remove the loading indicator message
          removeLastMessage();
          
          // Create a timer locally when server can't be reached
          const duration = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          
          let milliseconds = 0;
          if (unit.startsWith('sec')) milliseconds = duration * 1000;
          else if (unit.startsWith('min')) milliseconds = duration * 60 * 1000;
          else if (unit.startsWith('hour')) milliseconds = duration * 60 * 60 * 1000;
          
          // Verify the calculation is correct
          console.log(`⏱️ Creating client-side timer: ${duration} ${unit} = ${milliseconds}ms`);
          
          const timerLabel = `${duration} ${unit}${duration > 1 && !unit.endsWith('s') ? 's' : ''}`;
          
          // Add a success message
          addAIMessage(`I've set a timer for ${timerLabel}.`);
          
          // Handle the timer asynchronously to prevent UI blocking
          setTimeout(async () => {
            await handleTimerResponse({
              action: 'created',
              label: timerLabel,
              duration: duration,
              unit: unit,
              milliseconds: milliseconds
            });
          }, 100);
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
          
          const data = await processMessage(userMessage);
          
          // Remove the loading indicator message
          removeLastMessage();
          
          // Add the AI's response
          if (data?.response) {
            addAIMessage(data.response);
          } else {
            addAIMessage("I'm sorry, I couldn't process that request.");
          }
          
          // Handle timer-related response
          if (data?.timer) {
            console.log('⏰ Timer data received:', data.timer);
            
            // Use setTimeout to prevent UI blocking
            setTimeout(async () => {
              await handleTimerResponse(data.timer);
            }, 100);
            
            // Force immediate update of notifications for timers with delay
            setTimeout(async () => {
              await refreshLists();
            }, 500);
          } 
          // Still check general timer-related responses for backward compatibility
          else if (data?.response) {
            console.log('🔍 Checking response for timer references:', data.response.substring(0, 50) + '...');
            
            // Handle in non-blocking way
            setTimeout(async () => {
              await handleTimerRelatedResponse(data.response);
            }, 100);
          }
          
          // Refresh tasks and notifications with delay
          setTimeout(async () => {
            await refreshLists();
          }, 1000);
        } catch (err) {
          // Error occurred, but wasn't a timer request
          console.error('Error processing message:', err);
          removeLastMessage();
          addAIMessage("Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.");
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      removeLastMessage(); // Make sure to remove loading indicator if it exists
      addAIMessage("Sorry, I encountered an error processing your message. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addUserMessage, setMessage, setIsLoading, addLoadingMessage, processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists, toast, showNotification]);
}
