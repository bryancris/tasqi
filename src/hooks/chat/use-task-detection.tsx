
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/chat/types";
import { useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useTaskDetection() {
  const queryClient = useQueryClient();

  // Check if a message contains task-related commands or implicit tasks
  // Updated to detect more natural language that implies tasks
  const isTaskRelated = useCallback((content: string): boolean => {
    // Detect explicit task commands
    const taskCreationCommands = [
      'create task', 'add task', 'make task', 'schedule task',
      'create a task', 'add a task', 'make a task', 'schedule a task',
      'create new task', 'add new task', 'create reminder',
      'add to my tasks', 'add to tasks', 'put on my task list'
    ];
    
    // Detect implied tasks with action-related phrases
    const impliedTaskIndicators = [
      'i need to', 'i have to', 'i should', 'i must', 'don\'t forget to',
      'remember to', 'got to', 'gotta', 'i want to', 'we need to',
      'we have to', 'we should', 'need to finish', 'have to complete',
      'deadline', 'due', 'appointment', 'meeting', 'schedule'
    ];
    
    const lowerContent = content.toLowerCase();
    
    // Check for explicit commands first
    const containsExplicitCommand = taskCreationCommands.some(cmd => 
      lowerContent.includes(cmd)
    );
    
    // Then check for implied tasks
    const containsImpliedTask = impliedTaskIndicators.some(indicator => 
      lowerContent.includes(indicator)
    );
    
    const isTask = containsExplicitCommand || containsImpliedTask;
    console.log('Message task related?', isTask, content);
    return isTask;
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
