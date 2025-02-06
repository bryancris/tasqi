
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Task } from "@/components/dashboard/TaskBoard";

export function useWeeklyTasks(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],  // Use the same query key as useTasks
    queryFn: async () => {
      console.log('Fetching tasks for weekly calendar:', { weekStart, weekEnd });
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      console.log('Fetched tasks:', data);
      return data as Task[];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true
  });

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
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          void refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  return tasks;
}
