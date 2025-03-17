
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function useTaskDeletion(taskId: number, onSuccess: () => void) {
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      setIsDeletingTask(true);
      console.log("Deleting task with ID:", taskId);
      
      const {
        error
      } = await supabase.from('tasks').delete().eq('id', taskId);
      
      if (error) {
        console.error("Error from Supabase:", error);
        throw error;
      }
      
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task deleted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeletingTask(false);
    }
  };

  return {
    isDeletingTask,
    handleDelete
  };
}
