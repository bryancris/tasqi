
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Create singleton channels to persist across navigations
let tasksChannel: ReturnType<typeof supabase.channel> | null = null;
let notesChannel: ReturnType<typeof supabase.channel> | null = null;

export function useSupabaseSubscription() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only set up subscriptions if we have a valid session and haven't initialized yet
    if (!session || isInitialized.current) return;

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
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
            }
          )
          .subscribe((status) => {
            console.log('Tasks subscription status:', status);
          });
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
              queryClient.invalidateQueries({ queryKey: ['notes'] });
            }
          )
          .subscribe((status) => {
            console.log('Notes subscription status:', status);
          });
      }
    };

    setupSubscriptions();
    isInitialized.current = true;

    // Only clean up subscriptions when the component is truly unmounting
    return () => {
      // Check if we're actually unmounting the app (not just navigating)
      if (window.navigator.userAgent.includes('ReactSnap')) {
        if (tasksChannel) {
          supabase.removeChannel(tasksChannel);
          tasksChannel = null;
        }
        if (notesChannel) {
          supabase.removeChannel(notesChannel);
          notesChannel = null;
        }
        isInitialized.current = false;
      }
    };
  }, [queryClient, session]);
}
