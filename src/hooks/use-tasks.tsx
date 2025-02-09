
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useTasks() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No session, skipping task fetch');
        return [];
      }

      console.log('Fetching tasks with session:', session.user.id);
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
    enabled: !!session?.user?.id,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0
  });

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('No session, skipping subscription');
      return;
    }

    console.log('Setting up real-time subscription for user:', session.user.id);
    
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
          console.log('Received task change:', payload);
          queryClient.invalidateQueries({ queryKey: ['tasks', session.user.id] });
          void refetch();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch, session?.user?.id]);

  const wrappedRefetch = async () => {
    console.log('Refetching tasks...');
    await refetch();
  };

  return { tasks, refetch: wrappedRefetch };
}
