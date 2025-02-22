
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification } from "@/components/notifications/NotificationsManager";

interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => Promise<void>;
}

export function NotificationList({ notifications, onNotificationClick }: NotificationListProps) {
  return (
    <DropdownMenuContent align="end" className="w-80">
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No notifications
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="px-1">
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
