
import { cn } from "@/lib/utils";
import { useNotifications } from "./NotificationsManager";
import { Bell, Check, AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "../ui/alert-dialog";

interface NotificationGroupProps {
  groupId: string;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'high' | 'normal' | 'low';
  }>;
  onDismissGroup: (groupId: string) => void;
}

export function NotificationGroup({ groupId, notifications, onDismissGroup }: NotificationGroupProps) {
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  const sortedNotifications = [...notifications].sort((a, b) => {
    return (priorityOrder[a.priority || 'normal'] || 1) - (priorityOrder[b.priority || 'normal'] || 1);
  });

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className={cn(
        "max-w-sm m-0 transform-none transition-all duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "bg-white border shadow-lg"
      )}>
        <AlertDialogTitle className="sr-only">Notifications</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          Group of notifications requiring your attention
        </AlertDialogDescription>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Notification Group</span>
            </div>
            <button
              onClick={() => onDismissGroup(groupId)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg border",
                  notification.priority === 'high' && "bg-red-50 border-red-200",
                  notification.priority === 'normal' && "bg-blue-50 border-blue-200",
                  notification.priority === 'low' && "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div>
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
