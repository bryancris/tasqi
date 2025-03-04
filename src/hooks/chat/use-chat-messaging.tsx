
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMessageState } from "./use-message-state";
import { useLoadingState } from "./use-loading-state";
import { useNetworkDetection } from "./use-network-detection";
import { useTimerDetection } from "./use-timer-detection";
import { useServerCommunication } from "./use-server-communication";
import { toast } from "sonner";

export function useChatMessaging() {
  // Use the smaller, focused hooks
  const messageState = useMessageState();
  const { isLoading, setIsLoading } = useLoadingState();
  const { isNetworkAvailable } = useNetworkDetection();
  const timerDetection = useTimerDetection();
  const { invokeProcessChat } = useServerCommunication();
  
  const { toast: shadowToast } = useToast();
  const queryClient = useQueryClient();

  // Process the user's message with the AI
  const processMessage = async (userMessage: Message): Promise<{ 
    response?: string; 
    timer?: any;
    error?: Error;
    success?: boolean;
    taskCreated?: boolean;
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
      
      // Check if message is a timer request
      const { timerMatch, duration, unit } = timerDetection.detectTimerRequest(userMessage.content);
      
      if (timerMatch && duration && unit) {
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
      
      // For task-related requests, check for task-related keywords more thoroughly
      const taskRelatedTerms = [
        'create task', 'new task', 'add task', 'schedule task', 'remind me to', 
        'set a task', 'make a task', 'add to my tasks', 'schedule a', 'create a task',
        'add a task', 'set a reminder', 'schedule this', 'create an event', 'create reminder'
      ];
      
      const mightBeTaskRelated = taskRelatedTerms.some(term => 
        userMessage.content.toLowerCase().includes(term)
      );
      
      if (mightBeTaskRelated) {
        console.log('🔍 Message may be task-related, attempting to process as task');
        try {
          // Try using the process-task endpoint for task creation
          console.log('Calling process-task function with message:', userMessage.content.substring(0, 50) + '...');
          
          const { data, error } = await supabase.functions.invoke('process-task', {
            body: { message: userMessage.content, userId: user.id }
          });
          
          console.log('📝 Task processing response:', data);
          
          if (error) {
            console.error('❌ Task function error:', error);
            toast.error("Error creating task. Falling back to chat processing.");
            return await invokeProcessChat(userMessage.content, user.id);
          }
          
          // Check if task was successfully created
          if (data.success === true) {
            console.log('✅ Task created successfully:', data.task);
            
            // Dispatch a custom event for task creation
            try {
              window.dispatchEvent(new CustomEvent('ai-response', { 
                detail: { task: data.task }
              }));
            } catch (e) {
              console.error('Error dispatching task event:', e);
            }
            
            // Force refresh tasks after creation with a short delay
            setTimeout(() => {
              console.log('🔄 Refreshing tasks after task creation');
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
              
              // Show toast notification for task creation
              toast.success("Task created successfully!");
            }, 300);
            
            return {
              response: data.response,
              success: true,
              taskCreated: true
            };
          } else {
            console.log('ℹ️ Task not created, but response provided:', data.response);
            return {
              response: data.response,
              success: false,
              taskCreated: false
            };
          }
        } catch (taskError) {
          console.error('❌ Error in task processing, falling back to regular chat:', taskError);
          toast.error("Error creating task. Falling back to chat processing.");
          // Fall back to normal chat processing
          return await invokeProcessChat(userMessage.content, user.id);
        }
      }
      
      // For non-timer messages, always use the server
      const response = await invokeProcessChat(userMessage.content, user.id);
      
      // Always check for task-related keywords in the response
      if (response?.response && typeof response.response === 'string') {
        const taskCompletionPhrases = [
          'scheduled a task',
          'created a task',
          'added a task',
          'set up a task',
          'added this to your tasks',
          'task has been created'
        ];
        
        const containsTaskConfirmation = taskCompletionPhrases.some(phrase => 
          response.response!.toLowerCase().includes(phrase)
        );
        
        if (containsTaskConfirmation) {
          console.log('🔍 Response contains task confirmation, refreshing tasks');
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
          }, 500);
        }
      }
      
      return response;
    } catch (error) {
      if ((error as any)?.message?.includes('CORS')) {
        console.error('❌ CORS error processing message:', error);
        throw new Error("CORS policy prevented the request. This is a server configuration issue.");
      } else {
        console.error('❌ Error processing message:', error);
        throw error;
      }
    }
  };

  return {
    ...messageState,
    isLoading,
    processMessage,
    setIsLoading,
    shadowToast,
    queryClient
  };
}
