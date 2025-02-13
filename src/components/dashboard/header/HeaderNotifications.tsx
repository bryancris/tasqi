
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

export function HeaderNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Current user ID:', user.id);
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Query notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
        return [];
      }

      return data;
    }
  });

  // Play notification sound function
  const playNotificationSound = async () => {
    try {
      console.log('Playing notification sound...');
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Notification sound played successfully'))
          .catch(error => console.warn('Could not play notification sound:', error));
      }
    } catch (error) {
      console.warn('Error creating audio:', error);
    }
  };

  // Subscribe to new notifications
  useEffect(() => {
    if (!currentUserId) {
      console.log('No current user ID, skipping notification subscription');
      return;
    }

    console.log('Setting up notification subscription for user:', currentUserId);
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        async (payload: any) => {
          console.log('New notification received:', payload);
          console.log('Current user ID:', currentUserId);
          console.log('Notification user ID:', payload.new.user_id);
          
          // Check if this notification is for the current user
          if (payload.new.user_id === currentUserId) {
            console.log('Notification matches current user, playing sound...');
            
            // Play sound first before any other operations
            await playNotificationSound();
            
            // Update notifications in UI
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Show toast notification
            toast(payload.new.title, {
              description: payload.new.message,
            });
            
            // Handle system notification for shared tasks
            if (payload.new.type === 'task_share' && payload.new.reference_id) {
              try {
                // Fetch the shared task details
                const { data: task, error } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('id', payload.new.reference_id)
                  .single();

                if (error) throw error;

                if (task) {
                  // Show system notification
                  await showNotification(task, 'shared');
                }
              } catch (error) {
                console.error('Error handling shared task notification:', error);
              }
            }
          } else {
            console.log('Notification is not for current user, skipping sound');
          }
        }
      )
      .subscribe();

    console.log('Notification subscription set up');

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]); // Added currentUserId as dependency

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // If it's a shared task notification, navigate to the dashboard
      if (notification.type === 'task_share' && notification.reference_id) {
        navigate('/dashboard');
      }

      // Mark notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) throw error;

      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Error handling notification:', error);
      toast.error('Failed to update notification');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-600" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`p-4 cursor-pointer ${!notification.read ? 'bg-gray-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-500">{notification.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
