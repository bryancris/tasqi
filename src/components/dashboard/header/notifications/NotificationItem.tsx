
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Notification } from "@/components/notifications/NotificationsManager";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => Promise<void>;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <DropdownMenuItem
      key={notification.id}
      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${!notification.read ? 'bg-gray-50' : ''}`}
      onSelect={(event) => {
        event.preventDefault();
        onClick(notification);
      }}
    >
      <div>
        <div className="font-medium">{notification.title}</div>
        <div className="text-sm text-gray-500">{notification.message}</div>
        <div className="text-xs text-gray-400 mt-1">
          {new Date(notification.created_at).toLocaleString()}
        </div>
      </div>
    </DropdownMenuItem>
  );
}
