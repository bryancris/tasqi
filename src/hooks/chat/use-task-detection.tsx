
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useTaskDetection() {
  const queryClient = useQueryClient();

  // Check if a message contains task-related keywords
  const isTaskRelated = useCallback((content: string): boolean => {
    const taskRelatedTerms = [
      'create task', 'new task', 'add task', 'schedule task', 'remind me to', 
      'set a task', 'make a task', 'add to my tasks', 'schedule a', 'create a task',
      'add a task', 'set a reminder', 'schedule this', 'create an event', 'create reminder',
      'note down', 'write down', 'add to calendar', 'put on my schedule', 'remember to',
      'don\'t forget to', 'need to', 'have to', 'should', 'pick up', 'meeting', 'appointment',
      'deadline', 'due', 'finish', 'complete', 'attend', 'go to', 'call', 'email'
    ];
    
    const mightBeTaskRelated = taskRelatedTerms.some(term => 
      content.toLowerCase().includes(term)
    ) || /\b(at|on|tomorrow|today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(content);
    
    console.log('Message task related?', mightBeTaskRelated, content);
    return mightBeTaskRelated;
  }, []);

  // Process a message as a task
  const processAsTask = useCallback(async (content: string, userId: string) => {
    console.log('🔍 Message likely task-related, attempting to process as task:', content);
    
    try {
      console.log('Directly calling process-task function with message:', content);
      
      const { data, error } = await supabase.functions.invoke('process-task', {
        body: { message: content, userId }
      });
      
      console.log('📝 Task processing response:', data);
      
      if (error) {
        console.error('❌ Task function error:', error);
        toast.error("Error creating task. Falling back to chat processing.");
        return { success: false };
      }
      
      // Check if task was successfully created
      if (data?.success === true && data?.task) {
        console.log('✅ Task created successfully:', data.task);
        
        // Dispatch a custom event for task creation
        try {
          window.dispatchEvent(new CustomEvent('ai-response', { 
            detail: { task: data.task }
          }));
          console.log('✅ AI response event dispatched with task data');
        } catch (e) {
          console.error('Error dispatching task event:', e);
        }
        
        // Force refresh tasks after creation with a short delay
        setTimeout(() => {
          console.log('🔄 Refreshing tasks after successful task creation');
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
          
          // Show toast notification for task creation
          toast.success("Task created successfully!");
        }, 300);
        
        return {
          response: data.response,
          success: true,
          taskCreated: true,
          task: data.task
        };
      } else {
        console.log('ℹ️ No task created by process-task function, but response provided:', data?.response);
        
        // If the function didn't create a task but gave a response
        if (data?.response) {
          return {
            response: data.response,
            success: false,
            taskCreated: false
          };
        }
        
        return { success: false };
      }
    } catch (taskError) {
      console.error('❌ Error in task processing:', taskError);
      toast.error("Error creating task. Falling back to chat processing.");
      return { success: false };
    }
  }, [queryClient]);

  // Check if response contains task confirmation
  const hasTaskConfirmation = useCallback((response: string): boolean => {
    const taskCompletionPhrases = [
      'scheduled a task',
      'created a task',
      'added a task',
      'set up a task',
      'added this to your tasks',
      'task has been created',
      'noted down the task',
      'added to your calendar',
      'put on your schedule',
      'i\'ve scheduled', 
      'i\'ve created a task'
    ];
    
    return taskCompletionPhrases.some(phrase => 
      response.toLowerCase().includes(phrase)
    );
  }, []);

  // Try to extract and create a task from the response
  const tryExtractTaskFromResponse = useCallback(async (userMessage: string, userId: string, response: string) => {
    if (!hasTaskConfirmation(response)) return { success: false };
    
    console.log('🔍 Response contains task confirmation, but task wasn\'t created. Trying to create it now.');
    
    try {
      // Try to extract task info from the AI response and create the task
      const { data } = await supabase.functions.invoke('process-task', {
        body: { message: userMessage, userId }
      });
      
      if (data?.success === true && data?.task) {
        console.log('✅ Task created via secondary process:', data.task);
        
        // Dispatch event and refresh tasks
        window.dispatchEvent(new CustomEvent('ai-response', { 
          detail: { task: data.task }
        }));
        
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
          toast.success("Task created successfully!");
        }, 300);
        
        return {
          success: true,
          taskCreated: true,
          task: data.task
        };
      }
      
      return { success: false };
    } catch (err) {
      console.error('Failed secondary task creation attempt:', err);
      return { success: false };
    }
  }, [hasTaskConfirmation, queryClient]);

  return {
    isTaskRelated,
    processAsTask,
    hasTaskConfirmation,
    tryExtractTaskFromResponse
  };
}
