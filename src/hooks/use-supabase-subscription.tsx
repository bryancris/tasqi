
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Create singleton channels to persist across navigations
let tasksChannel: ReturnType<typeof supabase.channel> | null = null;
let notesChannel: ReturnType<typeof supabase.channel> | null = null;
let isGloballyInitialized = false;

export function useSupabaseSubscription() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isComponentMounted = useRef(true);

  useEffect(() => {
    // Only set up subscriptions if we have a valid session
    if (!session) return;

    const setupSubscriptions = () => {
      // Set up tasks subscription if not already established
      if (!tasksChannel) {
        tasksChannel = supabase
          .channel('tasks-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks'
            },
            () => {
              if (isComponentMounted.current) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
              }
            }
          )
          .subscribe();
      }

      // Set up notes subscription if not already established
      if (!notesChannel) {
        notesChannel = supabase
          .channel('notes-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notes'
            },
            () => {
              if (isComponentMounted.current) {
                queryClient.invalidateQueries({ queryKey: ['notes'] });
              }
            }
          )
          .subscribe();
      }
    };

    if (!isGloballyInitialized) {
      setupSubscriptions();
      isGloballyInitialized = true;
    }

    return () => {
      isComponentMounted.current = false;
      
      // Only clean up subscriptions when the window is actually closing
      const handleBeforeUnload = () => {
        if (tasksChannel) {
          supabase.removeChannel(tasksChannel);
          tasksChannel = null;
        }
        if (notesChannel) {
          supabase.removeChannel(notesChannel);
          notesChannel = null;
        }
        isGloballyInitialized = false;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    };
  }, [queryClient, session]);
}
