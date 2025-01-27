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

    const updatedTasks = Array.from(tasks);
    const [removed] = updatedTasks.splice(sourceIndex, 1);
    updatedTasks.splice(destinationIndex, 0, removed);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ position: destinationIndex + 1 })
        .eq('id', removed.id);

      if (error) throw error;

      // Update positions for other affected tasks
      const tasksToUpdate = updatedTasks
        .filter(task => task.id !== removed.id)
        .map((task, index) => ({
          position: index + 1,
          id: task.id
        }));

      for (const task of tasksToUpdate) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ position: task.position })
          .eq('id', task.id);

        if (updateError) throw updateError;
      }

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      toast({
        title: "Task reordered",
        description: "Task order has been updated",
      });

      // Invalidate to ensure we have the latest data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
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