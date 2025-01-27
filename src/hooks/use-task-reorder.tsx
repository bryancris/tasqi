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
      const updates = updatedTasks.map((task, index) => {
        const baseUpdate = {
          position: index + 1,
          title: task.title,
          status: task.status,
          user_id: task.user_id,
          priority: task.priority,
        };

        if (task.date) {
          return { ...baseUpdate, date: task.date };
        }

        return baseUpdate;
      });

      const { error } = await supabase
        .from('tasks')
        .upsert(updates, { 
          onConflict: 'id',
        });

      if (error) throw error;

      toast({
        title: "Task reordered",
        description: "Task order has been updated",
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error reordering task:', error);
      toast({
        title: "Error",
        description: "Failed to reorder task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
};