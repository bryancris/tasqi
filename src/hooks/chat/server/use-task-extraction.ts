
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProcessChatResponse } from "./use-server-communication-core";

export function useTaskExtraction() {
  const queryClient = useQueryClient();

  // Handle explicit task creation confirmation
  const handleTaskCreation = (data: ProcessChatResponse): ProcessChatResponse => {
    if (data?.taskCreated === true && data?.task) {
      console.log('✅ Task creation explicitly confirmed in response with task data:', data.task);
      
      // Dispatch AI response event with task data for form updates
      try {
        const customEvent = new CustomEvent('ai-response', { 
          detail: { task: data.task }
        });
        console.log('📣 Dispatching AI response event with task data:', customEvent);
        window.dispatchEvent(customEvent);
        console.log('✅ AI response event dispatched with task data');
      } catch (e) {
        console.error('❌ Error dispatching custom event:', e);
      }
      
      // Force refresh of task data with slight delay
      setTimeout(() => {
        console.log('🔄 Refreshing task lists after confirmed task creation');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
      }, 300);
    }
    
    return data;
  };

  // Check if response contains task creation language
  const containsTaskCreationLanguage = (response: string): boolean => {
    if (!response || typeof response !== 'string') return false;
    
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
      'added to your calendar',
      'i\'ve scheduled a task',
      'i\'ve created a task'
    ];
    
    return taskCreationPhrases.some(phrase => 
      response.toLowerCase().includes(phrase)
    );
  };

  // Try to extract task from response text
  const extractTaskFromResponse = async (
    data: ProcessChatResponse, 
    userMessage: string, 
    userId: string
  ): Promise<ProcessChatResponse> => {
    // Skip if already has task data or no response
    if (data.taskCreated || !data.response) return data;
    
    // Check for task creation language
    if (containsTaskCreationLanguage(data.response)) {
      console.log('🔍 Detected task creation language in response:', 
        data.response.substring(0, 100) + '...');
      
      // Check if the data actually contains a created task
      if (data.task) {
        console.log('✅ Found task data in response:', data.task);
        
        // Dispatch AI response event with task data for form updates
        try {
          window.dispatchEvent(new CustomEvent('ai-response', { 
            detail: { task: data.task }
          }));
          console.log('✅ AI response event dispatched with task data');
        } catch (e) {
          console.error('❌ Error dispatching custom event:', e);
        }
        
        // Force refresh of task data with slight delay
        setTimeout(() => {
          console.log('🔄 Task data found in response, refreshing tasks');
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
        }, 500);
        
        return {
          ...data,
          taskCreated: true
        };
      } else {
        console.log('⚠️ Task creation mentioned in response, but no task data found');
        console.log('🔄 Attempting manual task extraction and creation from message content');
        
        // Try the process-task endpoint as a fallback
        try {
          const { data: taskData, error: taskError } = await supabase.functions.invoke('process-task', {
            body: { message: userMessage, userId }
          });
          
          if (taskError) {
            console.error('❌ Task creation fallback error:', taskError);
          } else if (taskData?.success && taskData?.task) {
            console.log('✅ Task created via fallback method:', taskData.task);
            
            // Dispatch AI response event with task data
            try {
              window.dispatchEvent(new CustomEvent('ai-response', { 
                detail: { task: taskData.task }
              }));
              console.log('✅ AI response event dispatched with task data from fallback');
            } catch (e) {
              console.error('❌ Error dispatching custom event:', e);
            }
            
            // Force refresh of task data
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
            }, 500);
            
            return {
              ...data,
              taskCreated: true,
              task: taskData.task
            };
          }
        } catch (fallbackError) {
          console.error('❌ Task creation fallback failed:', fallbackError);
        }
      }
    }
    
    return data;
  };

  return {
    handleTaskCreation,
    extractTaskFromResponse,
    containsTaskCreationLanguage
  };
}
