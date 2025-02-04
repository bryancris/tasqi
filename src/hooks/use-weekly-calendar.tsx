import { format, isSameDay, parseISO } from "date-fns";
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
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      console.log('Fetched tasks from Supabase:', data);
      return data as Task[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
          });
        }
      )
      .subscribe();

    return () => {
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
      return isSameDay(parseISO(task.date), day);
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
        
        const formattedDate = format(new Date(dateStr), 'yyyy-MM-dd');
        
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