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

    // Get all tasks sorted by position
    const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

    // Move the task in the array
    const [movedTask] = sortedTasks.splice(sourceIndex, 1);
    sortedTasks.splice(destinationIndex, 0, movedTask);

    // Update positions for all affected tasks
    const updatedTasks = sortedTasks.map((task, index) => ({
      ...task,
      position: index + 1
    }));

    try {
      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      // Update the positions in the database
      for (const task of updatedTasks) {
        const { error } = await supabase
          .from('tasks')
          .update({ position: task.position })
          .eq('id', task.id);

        if (error) throw error;
      }

      toast({
        title: "Task reordered",
        description: "Task order has been updated",
      });
    } catch (error) {
      console.error('Error reordering task:', error);
      toast({
        title: "Error",
        description: "Failed to reorder task. Please try again.",
        variant: "destructive",
      });
      
      // Invalidate to ensure we have the latest data in case of error
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  return { handleDragEnd };
};