import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log('Fetching tasks for week:', { 
        weekStart: format(weekStart, 'yyyy-MM-dd'), 
        weekEnd: format(weekEnd, 'yyyy-MM-dd') 
      });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks from Supabase:', data);
      return data as Task[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('Setting up real-time subscription');
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, weekStart, weekEnd]);

  // Filter tasks by status
  const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
  const unscheduledTasks = tasks.filter(task => task.status === 'unscheduled');

  console.log('Filtered scheduled tasks:', scheduledTasks);

  // Calculate visits per day
  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = startOfDay(parseISO(task.date));
      const currentDay = startOfDay(day);
      return isSameDay(taskDate, currentDay);
    });
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = Number(active.id);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (over.id === 'unscheduled') {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'unscheduled',
            date: null,
            start_time: null,
            end_time: null
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        const [dateStr, hour] = (over.id as string).split('-');
        const hourNum = parseInt(hour);
        
        // Ensure we have a valid date string in YYYY-MM-DD format
        const targetDate = new Date(dateStr);
        const formattedDate = format(targetDate, 'yyyy-MM-dd');
        
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'scheduled',
            date: formattedDate,
            start_time: `${hourNum}:00`,
            end_time: `${hourNum + 1}:00`
          })
          .eq('id', taskId);

        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
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

  return {
    tasks,
    scheduledTasks,
    unscheduledTasks,
    visitsPerDay,
    handleDragEnd
  };
}