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
    if (destination.index === source.index) return;

    try {
      const orderedTasks = Array.from(tasks);
      const [movedTask] = orderedTasks.splice(source.index, 1);
      orderedTasks.splice(destination.index, 0, movedTask);

      // Calculate new positions with larger intervals
      const updatedTasks = orderedTasks.map((task, index) => ({
        ...task,
        position: (index + 1) * 1000
      }));

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], updatedTasks);

      // Prepare positions array for database update
      const positions = updatedTasks.map(task => ({
        task_id: task.id,
        new_position: task.position
      }));

      // Update database
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert to original order on error
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