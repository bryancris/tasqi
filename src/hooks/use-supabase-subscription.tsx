import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { playNotificationSound } from '@/utils/notifications/soundUtils';
import { useNotifications } from '@/components/notifications/NotificationsManager';
import { notificationService } from '@/utils/notifications/notificationService';
import { toast } from 'sonner';
import { useDebouncedTaskRefresh } from './use-debounced-task-refresh';

export function useSupabaseSubscription() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  const { invalidateTasks, cleanup } = useDebouncedTaskRefresh();
  
  // Add a ref to track if we've already initialized
  const initialized = useRef(false);
  // Track mounted state
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    // Only run once
    if (initialized.current) return;
    initialized.current = true;
    isMountedRef.current = true;
    
    console.log('Initializing Supabase subscriptions');
    
    const initializeNotifications = async () => {
      try {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          console.log('🔔 Initial notification permission:', permission);
        }
        
        // Initialize notification service
        console.log('🚀 Initializing notification service...');
        await notificationService.initialize();
      } catch (error) {
        if (isMountedRef.current) {
          console.error('❌ Error initializing notification service:', error);
          toast.error('Failed to initialize notifications');
        }
      }
    };

    void initializeNotifications();

    // Tasks channel - with improved update handling
    const tasksChannel = supabase.channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        () => {
          if (isMountedRef.current) {
            console.log('Task update from Supabase realtime - refreshing data');
            invalidateTasks(300); // Use a 300ms debounce for realtime updates
          }
        }
      )
      .subscribe((status) => {
        if (isMountedRef.current) {
          console.log('Tasks subscription status:', status);
        }
      });

    // Notes channel
    const notesChannel = supabase.channel('notes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          if (isMountedRef.current) {
            void queryClient.invalidateQueries({ queryKey: ['notes'] });
          }
        }
      )
      .subscribe();

    // Notifications channel
    const notificationsChannel = supabase.channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=eq.task_assignment'
        },
        async (payload) => {
          if (!isMountedRef.current) return;
          
          try {
            console.log('📝 New notification received:', payload);

            // Always play notification sound
            await playNotificationSound();

            // Show both system notification and in-app notification
            const notificationData = {
              title: payload.new.title,
              message: payload.new.message,
              data: {
                reference_id: payload.new.reference_id,
                reference_type: 'task_assignment'
              }
            };

            // Show system notification
            await notificationService.showNotification(notificationData);

            // Show in-app notification
            showNotification({
              title: payload.new.title,
              message: payload.new.message,
              type: 'info',
              persistent: true,
              reference_id: payload.new.reference_id,
              reference_type: 'task_assignment',
              action: {
                label: 'View Task',
                onClick: () => {
                  console.log('Navigating to task:', payload.new.reference_id);
                }
              }
            });

          } catch (error) {
            if (isMountedRef.current) {
              console.error('❌ Error handling task assignment notification:', error);
              toast.error('Failed to show notification');
            }
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up Supabase subscriptions');
      isMountedRef.current = false;
      cleanup();
      
      void supabase.removeChannel(tasksChannel);
      void supabase.removeChannel(notesChannel);
      void supabase.removeChannel(notificationsChannel);
    };
  }, [queryClient, showNotification, invalidateTasks, cleanup]);
}
