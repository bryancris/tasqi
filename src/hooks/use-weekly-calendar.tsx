
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useToast } from "./use-toast";
import { DragEndEvent } from "@dnd-kit/core";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(startOfDay(weekStart), 'yyyy-MM-dd');
      const endDate = format(endOfDay(weekEnd), 'yyyy-MM-dd');

      console.log('Fetching tasks for weekly calendar...', {
        weekStart: startDate,
        weekEnd: endDate
      });

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`and(status.eq.scheduled,date.gte.${startDate},date.lte.${endDate}),status.eq.unscheduled`)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks for weekly calendar:', data);
      return data as Task[];
    }
  });

  // Filter tasks for the weekly calendar
  const scheduledTasks = tasks?.filter(task => {
    if (!task.date || !task.start_time || task.status !== 'scheduled') {
      console.log('Filtering out task:', task.id, {
        hasDate: !!task.date,
        hasStartTime: !!task.start_time,
        status: task.status
      });
      return false;
    }

    const taskDate = parseISO(task.date);
    const isWithinWeek = taskDate >= startOfDay(weekStart) && taskDate <= endOfDay(weekEnd);

    console.log('Task date check:', {
      taskId: task.id,
      taskDate: format(taskDate, 'yyyy-MM-dd'),
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      isWithinWeek
    });

    return isWithinWeek;
  }) ?? [];

  console.log('Final filtered scheduled tasks:', scheduledTasks);

  const unscheduledTasks = tasks?.filter(task => 
    task.status === 'unscheduled'
  ) ?? [];

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

  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = startOfDay(parseISO(task.date));
      const currentDay = startOfDay(day);
      return +taskDate === +currentDay;
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
