
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

    console.log('🔄 Processing message in useChatSubmission:', message.substring(0, 30) + '...');
    
    // Create the user message and reset the input
    const userMessage = addUserMessage(message);
    setMessage("");
    setIsLoading(true);
    
    // Store information about timer detection to prevent duplicate processing
    let timerDetectedInMessage = false;
    let timerDuration = 0;
    let timerUnit = '';

    try {
      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const errorMsg = "Please sign in to send messages";
        toast.error(errorMsg);
        // Dispatch error event for mobile clients
        window.dispatchEvent(new CustomEvent('ai-error', { 
          detail: { error: errorMsg }
        }));
        setIsLoading(false);
        removeLastMessage(); // Remove loading message if added
        return;
      }

      // Add a loading indicator message while waiting for response
      addLoadingMessage();
      console.log('⏳ Added loading message, waiting for AI response...');

      // Check for timer commands in the user message before sending to the server
      const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
      const match = message.match(timerRegex);
      
      if (match && navigator.onLine) {
        // Store that we've detected a timer in the message to prevent duplicate notifications
        timerDetectedInMessage = true;
        timerDuration = parseInt(match[1]);
        timerUnit = match[2].toLowerCase();
        
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
        }
      } else {
        // If the message doesn't match timer regex or we're offline, use regular flow
        try {
          // Handle the case when we're offline but not a timer request
          if (!navigator.onLine) {
            removeLastMessage();
            const offlineMessage = "Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.";
            addAIMessage(offlineMessage);
            // Dispatch error event for mobile clients
            window.dispatchEvent(new CustomEvent('ai-error', { 
              detail: { error: "No internet connection" }
            }));
            setIsLoading(false);
            return;
          }
          
          console.log('🚀 Processing regular message in chat submission:', message.substring(0, 30) + '...');
          const data = await processMessage(userMessage);
          console.log('📊 Response data:', data);
          
          // Remove the loading indicator message
          removeLastMessage();
          
          // Add the AI's response
          if (data?.response) {
            addAIMessage(data.response);
            
            // Dispatch success response event with task data if available
            window.dispatchEvent(new CustomEvent('ai-response', { 
              detail: { 
                success: true, 
                task: data.taskCreated ? data.task : null,
                timer: data.timer || null
              }
            }));
            
            // If there's a task created by the AI, ensure we show the proper notification
            if (data.taskCreated && data.task) {
              console.log('✅ Task created in chat submission:', data.task);
              toast.success("Task created successfully!");
            }
          } else {
            addAIMessage("I'm sorry, I couldn't process that request.");
            
            // Dispatch generic success event
            window.dispatchEvent(new CustomEvent('ai-response', { 
              detail: { success: true }
            }));
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
          // Log the error for debugging
          console.error('❌ Error processing message:', err);
          
          // Remove the loading indicator and show an error message
          removeLastMessage();
          
          const errorMessage = err instanceof Error 
            ? err.message 
            : "Sorry, I'm having trouble connecting to the server. Please try again.";
          
          // Add error message as AI response
          addAIMessage(`Sorry, I encountered an error: ${errorMessage}`);
          
          // Show toast notification
          toast.error("Failed to process message. Please try again.");
          
          // Dispatch error event for mobile clients
          window.dispatchEvent(new CustomEvent('ai-error', { 
            detail: { error: errorMessage }
          }));
        }
      }
    } catch (error) {
      console.error('❌ Fatal error in chat submission:', error);
      
      // Clean up any loading messages
      removeLastMessage();
      
      // Add a user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Sorry, something went wrong. Please try again later.";
      
      addAIMessage(`Sorry, I encountered an error: ${errorMessage}`);
      
      // Show toast notification
      toast.error("Failed to process message. Please try again.");
      
      // Dispatch error event for mobile clients
      window.dispatchEvent(new CustomEvent('ai-error', { 
        detail: { error: errorMessage }
      }));
    } finally {
      setIsLoading(false);
      console.log('✅ Chat submission process completed');
    }
  }, [addUserMessage, setMessage, setIsLoading, addLoadingMessage, processMessage, removeLastMessage, addAIMessage, handleTimerResponse, handleTimerRelatedResponse, refreshLists, showNotification]);
}
