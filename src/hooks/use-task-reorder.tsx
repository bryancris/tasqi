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
      // Create an array of task positions to update
      const taskPositions = tasks.map((task, index) => ({
        task_id: task.id,
        new_position: index
      }));

      // Move the dragged task to its new position
      const [movedTask] = taskPositions.splice(source.index, 1);
      taskPositions.splice(destination.index, 0, movedTask);

      // Update positions to reflect new order
      const updatedPositions = taskPositions.map((task, index) => ({
        ...task,
        new_position: index
      }));

      // Call the reorder_tasks function
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: updatedPositions
      });

      if (error) throw error;

      // Update the cache with the new order
      queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        
        const newData = [...oldData];
        const [movedItem] = newData.splice(source.index, 1);
        newData.splice(destination.index, 0, movedItem);
        
        return newData.map((task, index) => ({
          ...task,
          position: index
        }));
      });

      // Refetch to ensure we have the latest data
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
}