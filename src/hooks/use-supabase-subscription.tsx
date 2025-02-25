
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { playNotificationSound } from '@/utils/notifications/soundUtils';
import { useNotifications } from '@/components/notifications/NotificationsManager';
import { notificationService } from '@/utils/notifications/notificationService';

export function useSupabaseSubscription() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Initialize notification service for PWA
        if ('serviceWorker' in navigator && window.matchMedia('(display-mode: standalone)').matches) {
          console.log('📱 Initializing PWA notification service...');
          await notificationService.initialize();
        }
      } catch (error) {
        console.error('❌ Error initializing notification service:', error);
      }
    };

    void initializeNotifications();

    // Tasks channel
    const tasksChannel = supabase.channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    // Notes channel
    const notesChannel = supabase.channel('notes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['notes'] });
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
          try {
            // Handle notifications differently for PWA vs regular web
            if ('serviceWorker' in navigator && window.matchMedia('(display-mode: standalone)').matches) {
              // PWA context: Use service worker for notifications
              await notificationService.showNotification({
                title: payload.new.title,
                message: payload.new.message,
                data: {
                  reference_id: payload.new.reference_id,
                  reference_type: 'task_assignment'
                }
              });
            } else {
              // Regular web context: Play sound and show in-app notification
              await playNotificationSound();
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
            }
          } catch (error) {
            console.error('Error handling task assignment notification:', error);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      void supabase.removeChannel(tasksChannel);
      void supabase.removeChannel(notesChannel);
      void supabase.removeChannel(notificationsChannel);
    };
  }, [queryClient, showNotification]);
}
