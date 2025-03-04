
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
    // Flag to track if a task has been created to prevent duplicate creation
    let taskCreatedSuccessfully = false;

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
        return;
      }

      // Add a loading indicator message while waiting for response
      addLoadingMessage();
      console.log('⏳ Added loading message, waiting for AI response...');

      // Enhanced logic for task detection - check if the message looks like a task before sending
      const taskKeywords = [
        'create task', 'add task', 'schedule task', 'remind', 'set a task', 
        'make a task', 'need to', 'have to', 'should', 'must', 'go to', 
        'pick up', 'get', 'buy', 'attend', 'call', 'meet', 'check'
      ];
      
      const containsTaskKeyword = taskKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      // If the message is short and looks like a command, it's probably a task
      const looksLikeTask = (message.length < 60 && 
                           /\b(go|get|buy|pick|call|email|visit|attend|clean|fix|write|read|watch)\b/i.test(message)) ||
                           containsTaskKeyword;
      
      // * First check for task creation
      if (looksLikeTask && navigator.onLine) {
        try {
          console.log('📝 Message looks like a task, attempting direct task creation');
          
          // Try to create a task directly first
          const { data: taskData, error: taskError } = await supabase.functions.invoke('process-task', {
            body: { message, userId: user.id }
          });
          
          if (taskError) {
            console.error('❌ Direct task creation error:', taskError);
            // Continue to regular processing - no task created yet
            console.log('⚠️ Direct task creation failed, falling back to regular processing');
          } else if (taskData?.success && taskData?.task) {
            console.log('✅ Task created directly from message:', taskData.task);
            
            // Mark that we've successfully created a task to prevent duplicate creation
            taskCreatedSuccessfully = true;
            
            // Remove the loading indicator
            removeLastMessage();
            
            // Add the success response
            addAIMessage(taskData.response || `I've created a task for "${taskData.task.title}".`);
            
            // Dispatch success with task data
            window.dispatchEvent(new CustomEvent('ai-response', { 
              detail: { success: true, task: taskData.task }
            }));
            
            // Show success toast
            toast.success("Task created successfully!");
            
            // Refresh lists after a delay
            setTimeout(() => {
              void refreshLists();
            }, 500);
            
            // * Early return to prevent duplicate processing
            setIsLoading(false);
            return;
          } else {
            console.log('⚠️ Task creation attempt returned success=false, falling back to regular processing');
            // Continue to regular processing - no task created yet
          }
        } catch (taskAttemptError) {
          console.error('❌ Error in task creation attempt:', taskAttemptError);
          // Continue to regular processing - no task created yet
          console.log('⚠️ Task creation attempt failed with exception, falling back to regular processing');
        }
      }

      // * Second path: Timer detection
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
        
        // * Complete timer processing
        setIsLoading(false);
        return;
      }

      // * Third path: Regular message processing
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
          
          // Check if task was created during regular processing
          if (data.taskCreated && data.task) {
            console.log('✅ Task created in regular processing:', data.task);
            toast.success("Task created successfully!");
          }
          
          // Dispatch success response event with task data if available
          window.dispatchEvent(new CustomEvent('ai-response', { 
            detail: { 
              success: true, 
              task: data.taskCreated ? data.task : null,
              timer: data.timer || null
            }
          }));
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
        
        // Fix for the "d.error is not a function" error:
        // Always use a string for the error message
        let errorMessage = "Sorry, I'm having trouble connecting to the server. Please try again.";
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = String(err);
        }
        
        // Add error message as AI response
        addAIMessage(`Sorry, I encountered an error: ${errorMessage}`);
        
        // Show toast notification
        toast.error("Failed to process message. Please try again.");
        
        // Dispatch error event for mobile clients
        window.dispatchEvent(new CustomEvent('ai-error', { 
          detail: { error: errorMessage }
        }));
      }
    } catch (error) {
      console.error('❌ Fatal error in chat submission:', error);
      
      // Clean up any loading messages
      removeLastMessage();
      
      // Add a user-friendly error message
      let errorMessage = "Sorry, something went wrong. Please try again later.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = String(error);
      }
      
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
