
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { NotificationList } from "./notifications/NotificationList";
import { useNotifications, Notification } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { debugLogNotification } from "@/utils/notifications/debug-utils";

export function HeaderNotifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications } = useNotifications();
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    console.log('📬 Handling notification click:', {
      notification,
      title: notification.title,
      referenceId: notification.referenceId, 
      referenceType: notification.referenceType 
    });

    // Debug log to trace properties
    debugLogNotification(notification, 'HeaderNotifications - handleNotificationClick');

    try {
      queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(n => n.id !== notification.id);
      });

      // Force the type to the expected "info" | "success" | "warning" | "error"
      // This ensures type safety
      const notificationType = (notification.type || "info") as "info" | "success" | "warning" | "error";
      
      showNotification({
        title: notification.title,
        message: notification.message,
        type: notificationType,
        referenceId: notification.referenceId,
        referenceType: notification.referenceType,
        persistent: true,
        action: notification.referenceType === 'task_share' && notification.referenceId ? {
          label: 'View Task',
          onClick: () => navigate('/dashboard')
        } : undefined
      });

      const { error } = await supabase
        .from('notifications')
        .delete()
        .match({ id: notification.id });

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
