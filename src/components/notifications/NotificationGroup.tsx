
import { cn } from "@/lib/utils";
import { useNotifications } from "./NotificationsManager";
import { Check, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "../ui/alert-dialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

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

  const handleDismiss = () => {
    setIsOpen(false);
    onDismissGroup(groupId);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className={cn(
        "max-w-sm transform-none transition-all duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "bg-white border shadow-lg",
        isMobile ? "fixed left-4 right-4 top-20 m-0 w-auto" : "m-0"
      )}>
        <AlertDialogTitle className="sr-only">Notifications</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          Group of notifications requiring your attention
        </AlertDialogDescription>
        
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
      </AlertDialogContent>
    </AlertDialog>
  );
}
