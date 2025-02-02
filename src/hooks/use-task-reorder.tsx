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

    if (!destination) return;

    try {
      // Create a new array with the reordered tasks
      const reorderedTasks = Array.from(tasks);
      const [removed] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, removed);

      // Update positions to be sequential
      const updatedPositions = reorderedTasks.map((task, index) => ({
        task_id: task.id,
        new_position: index
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], reorderedTasks.map((task, index) => ({
        ...task,
        position: index
      })));

      // Call the reorder_tasks function
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: updatedPositions
      });

      if (error) throw error;

      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert the cache to the original state
      queryClient.setQueryData(['tasks'], tasks);
      
      toast({
        title: "Error",
        description: "Failed to reorder tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
}