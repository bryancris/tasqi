
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

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

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <DropdownMenuItem
      key={notification.id}
      className={`p-4 cursor-pointer ${!notification.read ? 'bg-gray-50' : ''}`}
      onClick={() => onClick(notification)}
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
