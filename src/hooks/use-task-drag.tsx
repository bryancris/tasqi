import { DragEndEvent } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useTaskDrag(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = typeof active.id === 'string' ? parseInt(active.id, 10) : active.id;
    const [dayIndex, timeIndex] = over.id.toString().split('-').map(Number);
    
    // Calculate the actual date by adding dayIndex days to weekStart
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          date: format(targetDate, 'yyyy-MM-dd'),
          start_time: `${timeIndex}:00`,
          end_time: `${timeIndex + 1}:00`,
          status: 'scheduled'
        })
        .eq('id', taskId);

      if (error) throw error;

      queryClient.invalidateQueries({ 
        queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
      });
      
      toast({
        title: "Task rescheduled",
        description: "The task has been successfully moved to the new time slot.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
}