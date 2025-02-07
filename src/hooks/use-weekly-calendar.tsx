
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { format, parseISO } from "date-fns";
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
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
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

  // Filter tasks for the weekly calendar
  const scheduledTasks = tasks.filter(task => {
    // Exclude completed tasks
    if (task.status === 'completed') return false;
    
    // Check if task has required scheduling data
    if (!task.date || !task.start_time || !task.end_time) return false;
    
    // Check if task falls within the selected week, using parseISO for consistent date handling
    const taskDate = format(parseISO(task.date), 'yyyy-MM-dd');
    const weekStartDate = format(weekStart, 'yyyy-MM-dd');
    const weekEndDate = format(weekEnd, 'yyyy-MM-dd');
    
    return taskDate >= weekStartDate && taskDate <= weekEndDate;
  });

  console.log('Week range:', { weekStartDate: format(weekStart, 'yyyy-MM-dd'), weekEndDate: format(weekEnd, 'yyyy-MM-dd') });
  console.log('Filtered scheduled tasks:', scheduledTasks);

  const unscheduledTasks = tasks.filter(task => 
    task.status !== 'completed' && 
    (task.status === 'unscheduled' || (!task.date && !task.start_time))
  );

  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = format(parseISO(task.date), 'yyyy-MM-dd');
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
