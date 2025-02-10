
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { useEffect, useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TASKS_PER_PAGE = 20; // Limit number of tasks fetched at once

export function useTasks() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [page, setPage] = useState(0);
  const channelsRef = useRef<{
    tasksChannel?: ReturnType<typeof supabase.channel>;
    sharedTasksChannel?: ReturnType<typeof supabase.channel>;
  }>({});

  // Memoize the fetchTasks function
  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('No session, skipping task fetch');
      return [];
    }

    console.log('Fetching tasks for user:', session.user.id);
    
    try {
      // Get tasks owned by the user with pagination
      const { data: ownedTasks = [], error: ownedError } = await supabase
        .from('tasks')
        .select('*')
        .or(`user_id.eq.${session.user.id},owner_id.eq.${session.user.id}`)
        .order('position', { ascending: true })
        .range(page * TASKS_PER_PAGE, (page + 1) * TASKS_PER_PAGE - 1);

      if (ownedError) {
        console.error('Error fetching owned tasks:', ownedError);
        toast.error('Failed to load your tasks');
        return [];
      }

      // Get shared tasks with pagination
      const { data: sharedTasks = [], error: sharedError } = await supabase
        .from('shared_tasks')
        .select('task_id, tasks(*)')
        .eq('shared_with_user_id', session.user.id)
        .range(page * TASKS_PER_PAGE, (page + 1) * TASKS_PER_PAGE - 1);

      if (sharedError) {
        console.error('Error fetching shared tasks:', sharedError);
        toast.error('Failed to load shared tasks');
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

      console.log('Fetched tasks:', uniqueTasks.length);
      return uniqueTasks as Task[];
    } catch (error) {
      console.error('Error in task fetch:', error);
      toast.error('An error occurred while loading tasks');
      return [];
    }
  }, [session?.user?.id, page]);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks', session?.user?.id, page],
    queryFn: fetchTasks,
    enabled: !!session?.user?.id,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 60000,
  });

  const handleUpdate = useCallback(async () => {
    console.log('Invalidating queries and refetching...');
    await queryClient.invalidateQueries({ 
      queryKey: ['tasks', session?.user?.id] 
    });
  }, [queryClient, session?.user?.id]);

  // Setup real-time subscriptions with debounced updates
  useEffect(() => {
    if (!session?.user?.id) {
      console.log('No session, skipping subscription');
      return;
    }

    let updateTimeout: NodeJS.Timeout;
    const debounceUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        void handleUpdate();
      }, 500); // Debounce updates by 500ms
    };

    console.log('Setting up real-time subscriptions for user:', session.user.id);

    // Clean up existing channels
    if (channelsRef.current.tasksChannel) {
      supabase.removeChannel(channelsRef.current.tasksChannel);
    }
    if (channelsRef.current.sharedTasksChannel) {
      supabase.removeChannel(channelsRef.current.sharedTasksChannel);
    }

    // Create new channels with unique names
    const tasksChannel = supabase
      .channel(`tasks-changes-${session.user.id}-${Date.now()}`)
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
          debounceUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Tasks subscription status:', status);
      });

    const sharedTasksChannel = supabase
      .channel(`shared-tasks-changes-${session.user.id}-${Date.now()}`)
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
          debounceUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Shared tasks subscription status:', status);
      });

    channelsRef.current = {
      tasksChannel,
      sharedTasksChannel
    };

    return () => {
      console.log('Cleaning up subscriptions...');
      clearTimeout(updateTimeout);
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

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  return { 
    tasks, 
    refetch: wrappedRefetch,
    loadMore,
    hasMore: tasks.length === TASKS_PER_PAGE 
  };
}
