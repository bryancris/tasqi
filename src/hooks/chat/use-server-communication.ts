
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProcessChatResponse {
  response?: string;
  timer?: any;
  error?: Error;
  success?: boolean;
  taskCreated?: boolean;
}

export function useServerCommunication() {
  const queryClient = useQueryClient();

  // Invoke the process-chat function on the server
  const invokeProcessChat = async (
    content: string, 
    userId: string
  ): Promise<ProcessChatResponse> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: { message: content, userId }
      });
      
      const endTime = Date.now();
      console.log(`⏱️ Function invocation took ${endTime - startTime}ms`);

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      console.log('✅ Function returned data:', data);
      
      // Check for timer data
      if (data?.timer) {
        console.log('⏰ Timer data detected:', data.timer);
        // Force refresh of timer data with delay
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['timers'] });
        }, 300);
      }
      
      // Check for task creation confirmation in response
      if (data?.response && typeof data.response === 'string') {
        const taskCreationPhrases = [
          'created a task',
          'added a task', 
          'scheduled a task',
          'set up a task',
          'task has been created',
          'added to your tasks',
          'new task for you'
        ];
        
        const mightContainTaskConfirmation = taskCreationPhrases.some(phrase => 
          data.response!.toLowerCase().includes(phrase)
        );
        
        if (mightContainTaskConfirmation) {
          // Force refresh of task data with slight delay
          setTimeout(() => {
            console.log('🔄 Task creation detected in response, refreshing tasks');
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
            toast.success("Task created successfully!");
          }, 500);
        }
      }
      
      // Always invalidate tasks since a message might create a task
      // Add a short delay to ensure the backend has completed processing
      setTimeout(() => {
        console.log('🔄 Invalidating tasks query to refresh list');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        // Also refresh weekly tasks if they're being viewed
        queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
      }, 500);
      
      return data;
    } catch (error) {
      // Handle CORS and network errors
      if (
        (error instanceof TypeError && error.message === 'Failed to fetch') ||
        (error as any)?.message?.includes('CORS') ||
        ((error as any).cause instanceof TypeError && (error as any).cause.message === 'Failed to fetch')
      ) {
        console.error('❌ CORS or network error detected:', error);
        throw new Error("The server is currently unavailable. Please try again later.");
      } else {
        console.error('❌ Error invoking function:', error);
        throw error;
      }
    }
  };

  return {
    invokeProcessChat
  };
}
