
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

  // Subscribe to notifications changes (both new and deleted)
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
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload: any) => {
          console.log('📬 Notification change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('📦 New notification data:', payload.new);
            
            try {
              // Play sound for new notifications
              console.log('🔊 Attempting to play notification sound...');
              try {
                await playNotificationSound();
                console.log('✅ Notification sound played successfully');
              } catch (soundError) {
                console.error('❌ Error playing notification sound:', soundError);
              }

              // Invalidate query to refresh notifications
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              
            } catch (error) {
              console.error('❌ Error processing notification:', error);
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Notification deleted:', payload.old);
            // Invalidate query to refresh notifications
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
