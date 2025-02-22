
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { NotificationList } from "./notifications/NotificationList";
import { useNotifications } from "./notifications/useNotifications";

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
  const [isOpen, setIsOpen] = useState(false);
  const { notifications } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // If it's a task share notification, navigate to the dashboard
      if (notification.type === 'task_share' && notification.reference_id) {
        navigate('/dashboard');
      }

      // Delete the notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;

    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to remove notification');
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
