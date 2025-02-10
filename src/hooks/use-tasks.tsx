
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useTasks() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const channelsRef = useRef<{
    tasksChannel?: ReturnType<typeof supabase.channel>;
    sharedTasksChannel?: ReturnType<typeof supabase.channel>;
  }>({});

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No session, skipping task fetch');
        return [];
      }

      console.log('Fetching tasks for user:', session.user.id);
      
      try {
        // Get tasks owned by the user
        const { data: ownedTasks = [], error: ownedError } = await supabase
          .from('tasks')
          .select('*')
          .or(`user_id.eq.${session.user.id},owner_id.eq.${session.user.id}`)
          .order('position', { ascending: true });

        if (ownedError) {
          console.error('Error fetching owned tasks:', ownedError);
          return [];
        }

        // Get shared tasks
        const { data: sharedTasks = [], error: sharedError } = await supabase
          .from('shared_tasks')
          .select('task_id, tasks(*)')
          .eq('shared_with_user_id', session.user.id);

        if (sharedError) {
          console.error('Error fetching shared tasks:', sharedError);
          return [];
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
      } catch (error) {
        console.error('Error in task fetch:', error);
        return [];
      }
    },
    enabled: !!session?.user?.id,
    staleTime: 30000, // Increase stale time to 30 seconds
    gcTime: 300000,   // Increase cache time to 5 minutes
    refetchInterval: 60000 // Keep the 60-second polling
  });

  const handleUpdate = useCallback(async () => {
    console.log('Invalidating queries and refetching...');
    await queryClient.invalidateQueries({ queryKey: ['tasks', session?.user?.id] });
  }, [queryClient, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('No session, skipping subscription');
      return;
    }

    console.log('Setting up real-time subscriptions for user:', session.user.id);

    // Clean up any existing channels
    if (channelsRef.current.tasksChannel) {
      supabase.removeChannel(channelsRef.current.tasksChannel);
    }
    if (channelsRef.current.sharedTasksChannel) {
      supabase.removeChannel(channelsRef.current.sharedTasksChannel);
    }

    // Create new channels with unique names
    const tasksChannel = supabase
      .channel(`tasks-changes-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          console.log('Received task change');
          void handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Tasks subscription status:', status);
      });

    const sharedTasksChannel = supabase
      .channel(`shared-tasks-changes-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_tasks',
          filter: `shared_with_user_id=eq.${session.user.id}`
        },
        () => {
          console.log('Received shared task change');
          void handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Shared tasks subscription status:', status);
      });

    // Store the channels in the ref
    channelsRef.current = {
      tasksChannel,
      sharedTasksChannel
    };

    return () => {
      console.log('Cleaning up subscriptions...');
      if (channelsRef.current.tasksChannel) {
        void supabase.removeChannel(channelsRef.current.tasksChannel);
      }
      if (channelsRef.current.sharedTasksChannel) {
        void supabase.removeChannel(channelsRef.current.sharedTasksChannel);
      }
    };
  }, [session?.user?.id, handleUpdate]);

  const wrappedRefetch = useCallback(async () => {
    console.log('Refetching tasks...');
    await refetch();
  }, [refetch]);

  return { tasks, refetch: wrappedRefetch };
}
