
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
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

  // Get current user ID on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      console.log('🔄 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ Current user found:', user.id);
        setCurrentUserId(user.id);
      } else {
        console.log('❌ No current user found');
      }
    };
    getCurrentUser();
  }, []);

  // Query notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!currentUserId) {
        console.log('❌ Cannot fetch notifications: No current user ID');
        return [];
      }

      console.log('🔄 Fetching notifications for user:', currentUserId);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        return [];
      }

      console.log('✅ Fetched notifications:', data?.length || 0, 'notifications');
      return data;
    },
    enabled: !!currentUserId
  });

  // Subscribe to new notifications
  useEffect(() => {
    if (!currentUserId) {
      console.log('❌ No current user ID, skipping notification subscription');
      return;
    }

    console.log('🔔 Setting up notification subscription for user:', currentUserId);

    const channel = supabase.channel('notifications-channel')
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
          console.log('📦 Notification data:', payload.new);
          
          try {
            // Always attempt to play sound for new notifications
            console.log('🔊 Attempting to play notification sound...');
            try {
              await playNotificationSound();
              console.log('✅ Notification sound played successfully');
            } catch (soundError) {
              console.error('❌ Error playing notification sound:', soundError);
            }

            const notificationData = payload.new;
            
            // Show system notification for task assignments
            if (notificationData.type === 'task_assignment') {
              console.log('📋 Processing task assignment notification');
              try {
                const { data: task, error } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('id', notificationData.reference_id)
                  .single();

                if (error) {
                  console.error('❌ Error fetching task details:', error);
                  throw error;
                }
                
                if (task) {
                  console.log('🔔 Showing task notification:', task.title);
                  await showNotification(task, 'assignment');
                  console.log('✅ Task notification shown successfully');
                }
              } catch (error) {
                console.error('❌ Error fetching task details:', error);
              }
            }

            // Show toast notification
            console.log('🔔 Showing toast notification');
            toast(notificationData.title, {
              description: notificationData.message,
              duration: 5000,
              action: {
                label: "View",
                onClick: () => {
                  if (location.pathname !== '/dashboard') {
                    window.location.href = '/dashboard';
                  }
                }
              }
            });

            // Update notifications list
            console.log('🔄 Invalidating notifications query cache');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            
          } catch (error) {
            console.error('❌ Error processing notification:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);

  return { notifications, currentUserId };
}
