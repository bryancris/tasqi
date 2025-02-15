
import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useWeeklyTasks(weekStart: Date, weekEnd: Date) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) {
      return [];
    }

    console.log('Fetching tasks for weekly calendar:', { weekStart, weekEnd });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`status.eq.scheduled,status.eq.unscheduled`)
        .gte('date', weekStart.toISOString())
        .lte('date', weekEnd.toISOString())
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load weekly tasks');
        return [];
      }
      
      console.log('Fetched weekly tasks:', data?.length);
      return data as Task[];
    } catch (error) {
      console.error('Error in weekly task fetch:', error);
      toast.error('An error occurred while loading weekly tasks');
      return [];
    }
  }, [session?.user?.id, weekStart, weekEnd]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['weekly-tasks', session?.user?.id, weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: fetchTasks,
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

    let updateTimeout: NodeJS.Timeout;
    const debounceUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        handleUpdate();
      }, 500); // Debounce updates by 500ms
    };

    console.log('Setting up weekly tasks real-time subscription');
    
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`weekly-tasks-${session.user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          console.log('Received weekly tasks update');
          debounceUpdate();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log('Cleaning up weekly tasks subscription');
      clearTimeout(updateTimeout);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [session?.user?.id, handleUpdate]);

  return tasks;
}
