
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
      console.log('Invoking process-chat with message:', content.substring(0, 50) + '...');
      
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
      
      // Check for explicit task creation confirmation
      if (data?.taskCreated === true) {
        console.log('✅ Task creation explicitly confirmed in response');
        // Force refresh of task data with slight delay
        setTimeout(() => {
          console.log('🔄 Refreshing task lists after confirmed task creation');
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
          toast.success("Task created successfully!");
        }, 300);
        return data;
      }
      
      // Check for task creation confirmation in response text
      if (data?.response && typeof data.response === 'string') {
        const taskCreationPhrases = [
          'created a task',
          'added a task', 
          'scheduled a task',
          'set up a task',
          'added to your tasks',
          'task has been created',
          'new task for you',
          'noted down the task',
          'put on your schedule',
          'added to your calendar'
        ];
        
        const mightContainTaskConfirmation = taskCreationPhrases.some(phrase => 
          data.response!.toLowerCase().includes(phrase)
        );
        
        if (mightContainTaskConfirmation) {
          console.log('🔍 Detected task creation language in response:', 
            data.response.substring(0, 100) + '...');
          
          // Check if the data actually contains a created task
          if (data.task) {
            console.log('✅ Found task data in response:', data.task);
            
            // Force refresh of task data with slight delay
            setTimeout(() => {
              console.log('🔄 Task data found in response, refreshing tasks');
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
              toast.success("Task created successfully!");
            }, 500);
          } else {
            console.log('⚠️ Task creation mentioned in response, but no task data found');
            
            // Still refresh tasks in case the task was created but not returned properly
            setTimeout(() => {
              console.log('🔄 Task creation mentioned, refreshing tasks as precaution');
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
            }, 500);
          }
        }
      }
      
      // Always refresh tasks list to catch any possible task creations
      setTimeout(() => {
        console.log('🔄 Refreshing task and notification lists');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
