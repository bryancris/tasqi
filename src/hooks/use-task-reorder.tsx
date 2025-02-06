import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";

export function useTaskReorder(tasks: Task[], refetch: () => Promise<void>) {
  const queryClient = useQueryClient();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    try {
      const oldIndex = tasks.findIndex(task => task.id === active.id);
      const newIndex = tasks.findIndex(task => task.id === over.id);

      const updatedTasks = Array.from(tasks);
      const [movedTask] = updatedTasks.splice(oldIndex, 1);
      updatedTasks.splice(newIndex, 0, movedTask);

      // Calculate new positions with larger intervals
      const positions = updatedTasks.map((task, index) => ({
        task_id: task.id,
        new_position: (index + 1) * 1000
      }));

      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;

      // Force a refetch to get the updated order
      await refetch();

      toast.success("Task order updated successfully");
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error("Failed to reorder tasks. Please try again.");
    }
  };

  return { handleDragEnd };
}