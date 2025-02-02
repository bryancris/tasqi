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

    // If dropped outside the list or no change in position
    if (!destination || 
        (destination.index === source.index)) {
      return;
    }

    try {
      // Create a new array with the reordered tasks
      const reorderedTasks = Array.from(tasks);
      const [removed] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, removed);

      // Update positions to be sequential
      const updatedTasks = reorderedTasks.map((task, index) => ({
        ...task,
        position: index
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      // Prepare the positions update
      const positions = updatedTasks.map(task => ({
        task_id: task.id,
        new_position: task.position
      }));

      // Call the database function to update positions
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