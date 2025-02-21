
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotificationSound } from "./useNotificationSound";
import { showNotification } from "@/utils/notifications/notificationUtils";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  reference_id: string | null;
  reference_type: string | null;
  user_id: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { playNotificationSound } = useNotificationSound();

  // Get current user ID on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('📱 Current user ID:', user.id);
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Query notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!currentUserId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        return [];
      }

      return data;
    },
    enabled: !!currentUserId
  });

  // Subscribe to new notifications and task assignments
  useEffect(() => {
    if (!currentUserId) {
      console.log('❌ No current user ID, skipping subscriptions');
      return;
    }

    console.log('🔔 Setting up subscriptions for user:', currentUserId);

    // Create channels for both notifications and task assignments
    const notificationChannel = supabase.channel('notifications-and-tasks')
      // Listen for new notifications
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload: any) => {
          console.log('📬 New notification received:', payload);
          
          if (payload.new.user_id === currentUserId) {
            try {
              // Play sound for all notifications
              await playNotificationSound();

              // Handle task-related notifications
              if (['task_share', 'task_assignment'].includes(payload.new.type) && payload.new.reference_id) {
                console.log(`📋 Processing ${payload.new.type} notification`);
                try {
                  const { data: task, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', payload.new.reference_id)
                    .single();

                  if (error) throw error;
                  if (task) {
                    const notificationType = 
                      payload.new.type === 'task_share' ? 'shared' : 'assignment';
                    
                    console.log('🔔 Showing notification with type:', notificationType);
                    await showNotification(task, notificationType);
                  }
                } catch (error) {
                  console.error('❌ Error handling task notification:', error);
                }
              }

              // Show toast for the notification
              toast(payload.new.title, {
                description: payload.new.message,
                action: {
                  label: "View",
                  onClick: () => {
                    if (location.pathname !== '/dashboard') {
                      window.location.href = '/dashboard';
                    }
                  }
                }
              });

              // Refresh notifications list
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (error) {
              console.error('❌ Error processing notification:', error);
            }
          }
        }
      )
      // Listen for task assignments
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_assignments',
          filter: `assignee_id=eq.${currentUserId}`
        },
        async (payload: any) => {
          console.log('📝 New task assignment:', payload);
          try {
            // Play sound for new assignments
            await playNotificationSound();

            // Get the task details
            const { data: task, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', payload.new.task_id)
              .single();

            if (error) throw error;
            if (task) {
              console.log('🔔 Showing assignment notification for task:', task.title);
              await showNotification(task, 'assignment');

              // Show toast for the assignment
              toast("New Task Assignment", {
                description: `You have been assigned to: ${task.title}`,
                action: {
                  label: "View",
                  onClick: () => {
                    if (location.pathname !== '/dashboard') {
                      window.location.href = '/dashboard';
                    }
                  }
                }
              });
            }
          } catch (error) {
            console.error('❌ Error handling task assignment:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up subscriptions');
      supabase.removeChannel(notificationChannel);
    };
  }, [currentUserId, queryClient, playNotificationSound]);

  return { notifications, currentUserId };
}
