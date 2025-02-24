
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useToast } from "./use-toast";
import { DragEndEvent } from "@dnd-kit/core";
import { useMemo } from "react";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryDates = useMemo(() => ({
    start: format(startOfDay(weekStart), 'yyyy-MM-dd'),
    end: format(endOfDay(weekEnd), 'yyyy-MM-dd')
  }), [weekStart, weekEnd]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'], // Use a single key for all task data
    queryFn: async () => {
      console.log('Fetching tasks for weekly calendar...', {
        weekStart: queryDates.start,
        weekEnd: queryDates.end
      });

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data as Task[];
    },
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const scheduledTasks = useMemo(() => {
    return tasks?.filter(task => {
      if (!task.date || !task.start_time || task.status !== 'scheduled') return false;

      const taskDate = parseISO(task.date);
      const isWithinWeek = taskDate >= startOfDay(weekStart) && taskDate <= endOfDay(weekEnd);

      return isWithinWeek;
    }) ?? [];
  }, [tasks, weekStart, weekEnd]);

  const unscheduledTasks = useMemo(() => {
    return tasks?.filter(task => task.status === 'unscheduled') ?? [];
  }, [tasks]);

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

      // Optimistically update the cache
      queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(t => t.id === taskId ? { ...task, ...over.data?.current } : t);
      });

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
