
import { useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { useAuth } from "@/contexts/AuthContext";

export function useWeeklyTasks(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['weekly-tasks', session?.user?.id, weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async () => {
      if (!session?.user?.id) {
        return [];
      }

      console.log('Fetching tasks for weekly calendar:', { weekStart, weekEnd });
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id)
          .order('position', { ascending: true });
        
        if (error) {
          console.error('Error fetching tasks:', error);
          return [];
        }
        
        console.log('Fetched weekly tasks:', data);
        return data as Task[];
      } catch (error) {
        console.error('Error in weekly task fetch:', error);
        return [];
      }
    },
    staleTime: 30000,
    gcTime: 300000,
    enabled: !!session?.user?.id
  });

  const handleUpdate = useCallback(() => {
    console.log('Invalidating weekly tasks queries...');
    void queryClient.invalidateQueries({ 
      queryKey: ['weekly-tasks', session?.user?.id]
    });
  }, [queryClient, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('Setting up weekly tasks real-time subscription');
    const channel = supabase
      .channel(`weekly-tasks-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Received weekly tasks update:', payload);
          handleUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up weekly tasks subscription');
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id, handleUpdate]);

  return tasks;
}
