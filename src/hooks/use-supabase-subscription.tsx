
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseSubscription() {
  const queryClient = useQueryClient();
  const tasksSubscriptionRef = useRef<any>(null);
  const notesSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Set up tasks subscription
    if (!tasksSubscriptionRef.current) {
      const tasksChannel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
          }
        )
        .subscribe((status) => {
          console.log('Tasks subscription status:', status);
        });

      tasksSubscriptionRef.current = tasksChannel;
    }

    // Set up notes subscription
    if (!notesSubscriptionRef.current) {
      const notesChannel = supabase
        .channel('notes-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes'
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
          }
        )
        .subscribe((status) => {
          console.log('Notes subscription status:', status);
        });

      notesSubscriptionRef.current = notesChannel;
    }

    // Cleanup function
    return () => {
      if (tasksSubscriptionRef.current) {
        supabase.removeChannel(tasksSubscriptionRef.current);
        tasksSubscriptionRef.current = null;
      }
      if (notesSubscriptionRef.current) {
        supabase.removeChannel(notesSubscriptionRef.current);
        notesSubscriptionRef.current = null;
      }
    };
  }, [queryClient]);
}
