
import { useCallback } from "react";
import { Message } from "@/components/chat/types";
import { supabase } from "@/integrations/supabase/client";
import { useNetworkDetection } from "./use-network-detection";
import { useServerCommunication } from "./use-server-communication";
import { useTimerDetection } from "./use-timer-detection";
import { useTaskDetection } from "./use-task-detection";
import { useMessageErrorHandling } from "./use-message-error-handling";
import { useQueryClient } from "@tanstack/react-query";

export function useChatProcessing() {
  const { isNetworkAvailable } = useNetworkDetection();
  const { invokeProcessChat } = useServerCommunication();
  const timerDetection = useTimerDetection();
  const taskDetection = useTaskDetection();
  const { handleNetworkError } = useMessageErrorHandling();
  const queryClient = useQueryClient();

  const processMessage = useCallback(async (userMessage: Message): Promise<{ 
    response?: string; 
    timer?: any;
    error?: Error;
    success?: boolean;
    taskCreated?: boolean;
    task?: any;
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Authentication required for processing message');
        throw new Error("Authentication required");
      }

      console.log('🚀 Processing message:', userMessage.content.substring(0, 50) + '...');
      
      // First, check if the network is even available
      if (!isNetworkAvailable()) {
        throw new Error("You are currently offline. Please check your internet connection.");
      }
      
      // Check for timer intent in the message
      const { timerMatch, duration, unit } = timerDetection.detectTimerRequest(userMessage.content);
      
      if (timerMatch && duration && unit) {
        console.log("Timer intent detected, processing...");
        // Try the server-side function first with proper error handling
        try {
          const data = await invokeProcessChat(userMessage.content, user.id);
          
          // Check for timer data
          if (data?.timer) {
            timerDetection.refreshTimerData();
          }
          
          return data;
        } catch (serverError: any) {
          console.error('Server-side timer function failed, using client fallback:', serverError);
          
          // Special handling for CORS errors
          if (
            (serverError instanceof TypeError && serverError.message === 'Failed to fetch') ||
            serverError.message?.includes('CORS') ||
            (serverError.cause instanceof TypeError && serverError.cause.message === 'Failed to fetch')
          ) {
            console.error('❌ CORS or network error detected, using client-side fallback');
          }
          
          // Fall back to client-side response for timers
          return timerDetection.createClientSideTimerResponse(duration, unit);
        }
      }
      
      // Check for task-related content (both explicit and implied tasks)
      if (taskDetection.isTaskRelated(userMessage.content)) {
        console.log('📝 Task-related message detected, processing as task');
        const taskResult = await taskDetection.processAsTask(userMessage.content, user.id);
        
        if (taskResult.success) {
          return taskResult;
        }
        
        // Fall back to normal chat processing if task creation failed
        console.log('🔄 Falling back to regular chat processing');
      }
      
      // For non-timer/task messages, use the server
      console.log('💬 Processing as regular chat message');
      const response = await invokeProcessChat(userMessage.content, user.id);
      
      // Check for task confirmation in the response
      if (response?.response && typeof response.response === 'string' && 
          !response.taskCreated && taskDetection.hasTaskConfirmation(response.response)) {
        
        const extractResult = await taskDetection.tryExtractTaskFromResponse(
          userMessage.content, 
          user.id, 
          response.response
        );
        
        if (extractResult.success) {
          return {
            ...response,
            taskCreated: true,
            task: extractResult.task
          };
        }
      }
      
      // Always refresh tasks list to catch any possible task creations
      setTimeout(() => {
        console.log('🔄 Refreshing task and notification lists');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
      }, 500);
      
      return response;
    } catch (error) {
      const formattedError = handleNetworkError(error);
      throw formattedError;
    }
  }, [
    isNetworkAvailable, 
    timerDetection, 
    taskDetection, 
    invokeProcessChat, 
    queryClient, 
    handleNetworkError
  ]);

  return {
    processMessage
  };
}
