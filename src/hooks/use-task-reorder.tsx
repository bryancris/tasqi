import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DropResult } from "react-beautiful-dnd";

export function useTaskReorder(tasks: Task[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    // If dropped outside the list
    if (!destination) {
      return;
    }

    try {
      // Create a new array with the reordered tasks
      const reorderedTasks = Array.from(tasks);
      const [movedTask] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, movedTask);

      // Update positions for all tasks sequentially
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        position: index + 1, // Start positions from 1 to ensure proper ordering
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      // Update all task positions in the database
      const positions = updatedTasks.map(task => ({
        task_id: task.id,
        new_position: task.position
      }));

      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task reordered",
        description: "The task has been moved to its new position.",
      });

    } catch (error) {
      console.error('Error reordering tasks:', error);
      
      // Revert the cache to the original state
      queryClient.setQueryData(['tasks'], tasks);
      
      toast({
        title: "Error",
        description: "Failed to reorder task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
}