
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

  // Subscribe to new notifications
  useEffect(() => {
    if (!currentUserId) {
      console.log('❌ No current user ID, skipping notification subscription');
      return;
    }

    console.log('🔔 Setting up notification subscription for user:', currentUserId);
    
    const notificationChannel = supabase
      .channel('notifications')
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
          console.log('🔍 Comparing user IDs:', {
            payloadUserId: payload.new.user_id,
            currentUserId: currentUserId,
            isMatch: payload.new.user_id === currentUserId
          });
          
          // Only process notifications for the current user
          if (payload.new.user_id === currentUserId) {
            console.log('✅ User IDs match, processing notification');
            try {
              // Fetch task details if this is a task-related notification
              if (['task_share', 'task_assignment'].includes(payload.new.type) && payload.new.reference_id) {
                console.log('📋 Processing task notification');
                try {
                  const { data: task, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', payload.new.reference_id)
                    .single();

                  if (error) throw error;
                  if (task) {
                    // Show notification with sound for task assignments and shares
                    await showNotification(task, payload.new.type === 'task_share' ? 'shared' : 'reminder');
                    console.log('✅ Task notification shown successfully');
                  }
                } catch (error) {
                  console.error('❌ Error handling task notification:', error);
                }
              } else {
                // For non-task notifications, show a regular toast
                toast(payload.new.title, {
                  description: payload.new.message,
                });
              }

              // Refresh notifications list
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              
            } catch (error) {
              console.error('❌ Error processing notification:', error);
            }
          } else {
            console.log('⏭️ Skipping notification - user ID mismatch');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up notification subscription');
      supabase.removeChannel(notificationChannel);
    };
  }, [currentUserId, queryClient]);

  return { notifications, currentUserId };
}
