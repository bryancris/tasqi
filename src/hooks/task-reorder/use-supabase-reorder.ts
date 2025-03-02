
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSupabaseReorder() {
  // Send reorder request to Supabase
  const reorderTasksInDatabase = async (positions: { task_id: number, new_position: number }[]) => {
    try {
      const { error } = await supabase.rpc('reorder_tasks', {
        task_positions: positions
      });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error reordering tasks in database:', error);
      toast.error("Failed to reorder tasks. Please try again.");
      return false;
    }
  };

  return { reorderTasksInDatabase };
}
