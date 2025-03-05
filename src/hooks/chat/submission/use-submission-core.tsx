
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { toast } from "sonner";
import { useTaskCreation } from "./use-task-creation";
import { useTimerHandling } from "./use-timer-handling";
import { useErrorHandling } from "./use-error-handling";
import { SubmissionHelpers } from "./types";

export function useSubmissionCore(helpers: SubmissionHelpers) {
  const { showNotification } = useNotifications();
  
  // Import our specialized hooks
  const handleTaskCreation = useTaskCreation({
    processMessage: helpers.processMessage,
    removeLastMessage: helpers.removeLastMessage,
    addAIMessage: helpers.addAIMessage,
    refreshLists: helpers.refreshLists,
  });
  
  const handleTimerDetection = useTimerHandling({
    processMessage: helpers.processMessage,
    removeLastMessage: helpers.removeLastMessage,
    addAIMessage: helpers.addAIMessage,
    handleTimerResponse: helpers.handleTimerResponse,
    handleTimerRelatedResponse: helpers.handleTimerRelatedResponse,
    refreshLists: helpers.refreshLists,
  });
  
  const handleErrors = useErrorHandling({
    removeLastMessage: helpers.removeLastMessage,
    addAIMessage: helpers.addAIMessage,
  });

  return useCallback(async (e: React.FormEvent, message: string) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    // Check for command patterns
    if (message.trim().toLowerCase() === '/clear') {
      // Handle the clear command
      if (helpers.resetMessages) {
        helpers.resetMessages();
        // Add a system message to confirm the action
        setTimeout(() => {
          helpers.addAIMessage("Chat history has been cleared.");
        }, 100);
      } else {
        toast.error("Could not clear chat history. The reset function is unavailable.");
      }
      helpers.setMessage("");
      return;
    }

    console.log('🔄 Processing message in useSubmissionCore:', message.substring(0, 30) + '...');
    
    // Create the user message and reset the input
    const userMessage = helpers.addUserMessage(message);
    helpers.setMessage("");
    helpers.setIsLoading(true);
    
    // Store information about timer detection to prevent duplicate processing
    let timerDetectedInMessage = false;
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
        helpers.setIsLoading(false);
        return;
      }

      // Add a loading indicator message while waiting for response
      helpers.addLoadingMessage();
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
          // Try to create a task first
          const taskResult = await handleTaskCreation(message, user.id);
          
          // If task creation was successful, return early
          if (taskResult.success) {
            taskCreatedSuccessfully = true;
            helpers.setIsLoading(false);
            return;
          }
        } catch (taskError) {
          console.error('❌ Error in task creation attempt:', taskError);
          // Continue to regular processing
        }
      }

      // * Second path: Timer detection
      // Check for timer commands in the user message before sending to the server
      const timerRegex = /set a (\d+)\s*(min|minute|hour|second|sec)s?\s*timer/i;
      const match = message.match(timerRegex);
      
      if (match && navigator.onLine) {
        timerDetectedInMessage = true;
        try {
          // Try the timer handling path
          const timerResult = await handleTimerDetection(userMessage, match);
          if (timerResult.handled) {
            helpers.setIsLoading(false);
            return;
          }
        } catch (timerError) {
          console.error('❌ Error in timer handling:', timerError);
          // Continue to regular message processing
        }
      }

      // * Third path: Regular message processing
      if (!navigator.onLine) {
        helpers.removeLastMessage();
        const offlineMessage = "Sorry, I'm having trouble connecting to the server. Please check your internet connection and try again.";
        helpers.addAIMessage(offlineMessage);
        // Dispatch error event for mobile clients
        window.dispatchEvent(new CustomEvent('ai-error', { 
          detail: { error: "No internet connection" }
        }));
        helpers.setIsLoading(false);
        return;
      }
      
      try {
        console.log('🚀 Processing regular message:', message.substring(0, 30) + '...');
        const data = await helpers.processMessage(userMessage);
        console.log('📊 Response data:', data);
        
        // Remove the loading indicator message
        helpers.removeLastMessage();
        
        // Add the AI's response
        if (data?.response) {
          helpers.addAIMessage(data.response);
          
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
          helpers.addAIMessage("I'm sorry, I couldn't process that request.");
          
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
            void helpers.handleTimerResponse(data.timer);
          }, 200);
        } 
        // Only check for timer phrases if we didn't explicitly detect a timer command in the original message
        else if (data?.response && !timerDetectedInMessage) {
          setTimeout(() => {
            void helpers.handleTimerRelatedResponse(data.response!);
          }, 500);
        }
        
        // Refresh tasks and notifications with longer delay
        setTimeout(() => {
          void helpers.refreshLists();
        }, 1500);
      } catch (err) {
        // Handle errors in the regular processing flow
        handleErrors(err, "Sorry, I encountered an error processing your message. Please try again later.");
        
        // Dispatch error event for mobile clients
        let errorMessage = "Failed to process message";
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = String(err);
        }
        
        window.dispatchEvent(new CustomEvent('ai-error', { 
          detail: { error: errorMessage }
        }));
        
        toast.error("Failed to process message. Please try again.");
      }
    } catch (error) {
      // Handle fatal errors in the overall flow
      console.error('❌ Fatal error in chat submission:', error);
      
      handleErrors(error, "Sorry, something went wrong. Please try again later.");
      
      // Show toast notification
      toast.error("Failed to process message. Please try again.");
      
      // Dispatch error event for mobile clients
      let errorMessage = "Fatal error processing message";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = String(error);
      }
      
      window.dispatchEvent(new CustomEvent('ai-error', { 
        detail: { error: errorMessage }
      }));
    } finally {
      helpers.setIsLoading(false);
      console.log('✅ Chat submission process completed');
    }
  }, [
    helpers.addUserMessage, 
    helpers.setMessage, 
    helpers.setIsLoading, 
    helpers.addLoadingMessage, 
    helpers.processMessage, 
    helpers.removeLastMessage, 
    helpers.addAIMessage, 
    helpers.handleTimerResponse, 
    helpers.handleTimerRelatedResponse, 
    helpers.refreshLists,
    helpers.resetMessages,
    handleTaskCreation,
    handleTimerDetection,
    handleErrors
  ]);
}
