
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TaskCreationHelpers } from "./types";

export function useTaskCreation({
  processMessage,
  removeLastMessage,
  addAIMessage,
  refreshLists
}: TaskCreationHelpers) {
  return useCallback(async (message: string, userId: string): Promise<{ success: boolean }> => {
    console.log('📝 Message looks like a task, attempting direct task creation');
    
    try {
      // Try to create a task directly first
      const { data: taskData, error: taskError } = await supabase.functions.invoke('process-task', {
        body: { message, userId }
      });
      
      if (taskError) {
        console.error('❌ Direct task creation error:', taskError);
        // Continue to regular processing - no task created yet
        console.log('⚠️ Direct task creation failed, falling back to regular processing');
        return { success: false };
      } 
      
      if (taskData?.success && taskData?.task) {
        console.log('✅ Task created directly from message:', taskData.task);
        
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
        
        // * Return successful task creation
        return { success: true };
      }
      
      console.log('⚠️ Task creation attempt returned success=false, falling back to regular processing');
      return { success: false };
    } catch (taskAttemptError) {
      console.error('❌ Error in task creation attempt:', taskAttemptError);
      // Continue to regular processing - no task created yet
      console.log('⚠️ Task creation attempt failed with exception, falling back to regular processing');
      return { success: false };
    }
  }, [processMessage, removeLastMessage, addAIMessage, refreshLists]);
}
