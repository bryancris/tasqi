
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

export function NotificationList({ notifications, onNotificationClick }: NotificationListProps) {
  return (
    <DropdownMenuContent align="end" className="w-80">
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No notifications
        </div>
      ) : (
        <ScrollArea className="h-[400px]"> {/* Height for ~5 items */}
          <div className="px-1"> {/* Add padding to account for scrollbar */}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </DropdownMenuContent>
  );
}
