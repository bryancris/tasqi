import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DropResult } from "react-beautiful-dnd";
import { useToast } from "./use-toast";

export function useTaskReorder(tasks: Task[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.index === destination.index) return;

    const reorderedTasks = Array.from(tasks);
    const [removed] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, removed);

    // Calculate new positions
    const taskPositions = reorderedTasks.map((task, index) => ({
      task_id: task.id,
      new_position: (index + 1) * 1000
    }));

    try {
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: taskPositions
      });

      if (error) throw error;

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], reorderedTasks);

      toast({
        title: "Tasks reordered",
        description: "Task positions have been updated",
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tasks. Please try again.",
        variant: "destructive",
      });
      
      // Invalidate the cache to refetch the correct order
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  return { handleDragEnd };
}