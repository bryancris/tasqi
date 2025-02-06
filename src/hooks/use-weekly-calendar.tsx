
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
      console.log('Fetching tasks for weekly calendar...');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Fetched tasks for weekly calendar:', data);
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
        // Safely handle the drop data
        const dropData = over.data?.current as { date?: string; hour?: number } | undefined;
        if (!dropData || !dropData.date || typeof dropData.hour !== 'number') {
          console.error('Invalid drop data:', dropData);
          return;
        }

        const startTime = `${dropData.hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(dropData.hour + 1).toString().padStart(2, '0')}:00:00`;

        console.log('Drop data:', { date: dropData.date, startTime, endTime });

        const { error } = await supabase
          .from('tasks')
          .update({
            date: dropData.date,
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

  console.log('All tasks before filtering:', tasks);

  const scheduledTasks = tasks.filter(task => 
    task.status === 'scheduled' && task.date && task.start_time
  );

  console.log('Scheduled tasks:', scheduledTasks);

  const unscheduledTasks = tasks.filter(task => 
    task.status === 'unscheduled' || !task.status
  );

  console.log('Unscheduled tasks:', unscheduledTasks);

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
