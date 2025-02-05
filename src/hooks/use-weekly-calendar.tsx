
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { format } from "date-fns";
import { useToast } from "./use-toast";
import { DragEndEvent } from "@dnd-kit/core";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      console.log('Fetched tasks:', data);
      return data as Task[];
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = typeof active.id === 'string' ? parseInt(active.id, 10) : active.id;
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (over.id === 'unscheduled') {
        const { error } = await supabase
          .from('tasks')
          .update({
            date: null,
            start_time: null,
            end_time: null,
            status: 'unscheduled'
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        const dropData = over.data?.current as { date: string; hour: number } | undefined;
        if (!dropData) {
          console.error('Missing drop data');
          return;
        }

        const { date, hour } = dropData;
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        console.log('Drop data:', { date, startTime, endTime });

        const { error } = await supabase
          .from('tasks')
          .update({
            date: date,
            start_time: startTime,
            end_time: endTime,
            status: 'scheduled'
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Task updated",
        description: "The task has been successfully moved.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scheduledTasks = tasks.filter(task => 
    task.status === 'scheduled' && task.date && task.start_time
  );

  // Only show unscheduled tasks that are not completed
  const unscheduledTasks = tasks.filter(task => 
    task.status === 'unscheduled' && task.status !== 'completed'
  );

  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
      return taskDate === format(day, 'yyyy-MM-dd');
    });
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

  return {
    tasks,
    scheduledTasks,
    unscheduledTasks,
    visitsPerDay,
    handleDragEnd
  };
}
