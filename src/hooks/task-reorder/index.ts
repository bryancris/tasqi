
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@/components/dashboard/TaskBoard";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { QueryObserverResult } from "@tanstack/react-query";
import { usePositionCalculation } from "./use-position-calculation";
import { useDragEventHandler } from "./use-drag-event-handler";
import { useSupabaseReorder } from "./use-supabase-reorder";

export function useTaskReorder(tasks: Task[], refetch: () => Promise<QueryObserverResult<Task[], Error>>) {
  const queryClient = useQueryClient();
  const { calculateNewPositions } = usePositionCalculation();
  const { processDragEnd } = useDragEventHandler(tasks);
  const { reorderTasksInDatabase } = useSupabaseReorder();

  const handleDragEnd = async (event: DragEndEvent) => {
    // Process the drag event
    const updatedTasks = processDragEnd(event);
    
    // If no tasks to update, return early
    if (!updatedTasks) return;

    try {
      // Calculate new positions
      const positions = calculateNewPositions(updatedTasks);
      
      // Save to database
      const success = await reorderTasksInDatabase(positions);
      
      if (success) {
        // Force a refetch to get the updated order
        await refetch();
        toast.success("Task order updated successfully");
      }
    } catch (error) {
      console.error('Error in task reordering process:', error);
      toast.error("Failed to reorder tasks. Please try again.");
    }
  };

  return { handleDragEnd };
}

// Re-export the individual hooks for direct use if needed
export { usePositionCalculation } from './use-position-calculation';
export { useDragEventHandler } from './use-drag-event-handler';
export { useSupabaseReorder } from './use-supabase-reorder';
