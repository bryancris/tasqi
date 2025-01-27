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
      const updates = updatedTasks.map((task, index) => ({
        id: task.id,
        position: index + 1,
        title: task.title,
        user_id: task.user_id,
        status: task.status,
        priority: task.priority || 'low',
        date: task.date || null,
        description: task.description || null,
        start_time: task.start_time || null,
        end_time: task.end_time || null
      }));

      const { error } = await supabase
        .from('tasks')
        .upsert(updates, { 
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) throw error;

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