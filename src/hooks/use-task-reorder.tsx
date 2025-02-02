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

    if (!destination) {
      return;
    }

    try {
      // Create a copy of tasks array and ensure all tasks have valid positions
      const sortedTasks = [...tasks]
        .map(task => ({
          ...task,
          position: task.position ?? 0
        }))
        .sort((a, b) => a.position - b.position);

      // Remove task from source and insert at destination
      const [movedTask] = sortedTasks.splice(source.index, 1);
      sortedTasks.splice(destination.index, 0, movedTask);

      // Calculate new positions with larger intervals
      const updatedTasks = sortedTasks.map((task, index) => ({
        ...task,
        position: (index + 1) * 1000
      }));

      // Prepare positions array for database update
      const positions = updatedTasks.map(task => ({
        task_id: task.id,
        new_position: task.position
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      // Update database
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

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