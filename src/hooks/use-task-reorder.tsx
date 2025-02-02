import { Task } from "@/components/dashboard/TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropResult } from "react-beautiful-dnd";

export const useTaskReorder = (tasks: Task[]) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    try {
      // Create a new array with the updated order
      const updatedTasks = Array.from(tasks);
      const [movedTask] = updatedTasks.splice(sourceIndex, 1);
      updatedTasks.splice(destinationIndex, 0, movedTask);

      // Update positions for all tasks
      const tasksWithNewPositions = updatedTasks.map((task, index) => ({
        ...task,
        position: index
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], tasksWithNewPositions);

      // Update the database
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: tasksWithNewPositions.map(task => ({
          task_id: task.id,
          new_position: task.position
        }))
      });

      if (error) throw error;

      // Refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tasks. Please try again.",
        variant: "destructive",
      });
      
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  return { handleDragEnd };
};