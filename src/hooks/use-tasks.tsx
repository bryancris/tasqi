
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

      console.log('Fetching tasks for user:', session.user.id);
      
      // Get tasks owned by the user
      const { data: ownedTasks = [], error: ownedError } = await supabase
        .from('tasks')
        .select('*')
        .or(`user_id.eq.${session.user.id},owner_id.eq.${session.user.id}`)
        .order('position', { ascending: true });

      if (ownedError) {
        console.error('Error fetching owned tasks:', ownedError);
        throw ownedError;
      }

      // Get shared tasks
      const { data: sharedTasks = [], error: sharedError } = await supabase
        .from('shared_tasks')
        .select('task_id, tasks(*)')
        .eq('shared_with_user_id', session.user.id);

      if (sharedError) {
        console.error('Error fetching shared tasks:', sharedError);
        throw sharedError;
      }

      // Combine and deduplicate tasks
      const allTasks = [
        ...ownedTasks,
        ...sharedTasks.map(st => ({
          ...st.tasks,
          shared: true
        }))
      ];

      // Remove duplicates based on task ID
      const uniqueTasks = Array.from(
        new Map(allTasks.map(task => [task.id, task])).values()
      );

      console.log('Fetched tasks:', uniqueTasks);
      return uniqueTasks as Task[];
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
          table: 'tasks',
          filter: `user_id=eq.${session.user.id}`
        },
        async (payload) => {
          console.log('Received task change:', payload);
          await queryClient.invalidateQueries({ queryKey: ['tasks', session.user.id] });
          await refetch();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription...');
      void supabase.removeChannel(channel);
    };
  }, [queryClient, refetch, session?.user?.id]);

  const wrappedRefetch = async () => {
    console.log('Refetching tasks...');
    await refetch();
  };

  return { tasks, refetch: wrappedRefetch };
}
