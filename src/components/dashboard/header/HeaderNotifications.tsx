
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NotificationList } from "./notifications/NotificationList";
import { useNotifications, useNotifications as useAlertNotifications, Notification } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";

export function HeaderNotifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications } = useNotifications();
  const queryClient = useQueryClient();
  const { showNotification } = useAlertNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    try {
      queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(n => n.id !== notification.id);
      });

      showNotification({
        title: notification.title,
        message: notification.message,
        type: 'info',
        action: notification.type === 'task_share' && notification.reference_id ? {
          label: 'View Task',
          onClick: () => navigate('/dashboard')
        } : undefined
      });

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (error) {
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error('Error deleting notification:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to remove notification',
        type: 'error'
      });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <NotificationList 
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
      />
    </DropdownMenu>
  );
}
