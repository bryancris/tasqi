
import { cn } from "@/lib/utils";
import { useNotifications } from "./context/NotificationsContext";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { debugLogNotification, validateTaskNotification } from "@/utils/notifications/debug-utils";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "../ui/alert-dialog";
import { NotificationContent } from "./alert-notification/NotificationContent";
import { NotificationButtons } from "./notification-buttons";
import { useQueryClient } from "@tanstack/react-query";
import { Notification } from "./types"; // Import the correct Notification type

interface NotificationGroupProps {
  groupId: string;
  notifications: Notification[]; // Use the correct type here
  onDismissGroup: (groupId: string) => void;
}

export function NotificationGroup({ groupId, notifications, onDismissGroup }: NotificationGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  console.log('🧩 RENDERING NOTIFICATION GROUP:', {
    groupId,
    notificationCount: notifications.length,
    firstNotificationProps: notifications[0] ? {
      title: notifications[0].title,
      message: notifications[0].message,
      referenceId: notifications[0].referenceId,
      referenceType: notifications[0].referenceType,
      type: notifications[0].type
    } : 'No notifications'
  });

  if (notifications.length > 0) {
    debugLogNotification(notifications[0], `NotificationGroup (${groupId})`);
    const shouldShowButtons = validateTaskNotification(notifications[0]);
    console.log(`🔘 Should show buttons: ${shouldShowButtons} for group ${groupId}`);
  }

  const priorityOrder = { high: 0, normal: 1, low: 2 };
  const sortedNotifications = [...notifications].sort((a, b) => {
    return (priorityOrder[a.priority || 'normal'] || 1) - (priorityOrder[b.priority || 'normal'] || 1);
  });

  const handleDismiss = () => {
    setIsOpen(false);
    onDismissGroup(groupId);
  };

  const isTaskNotificationGroup = notifications.some(notification => 
    notification.referenceType === 'task' && notification.referenceId
  );

  const isTestNotificationGroup = notifications.some(notification =>
    notification.referenceId === "999999" || notification.referenceId === 999999
  );

  const referenceId = notifications[0]?.referenceId;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className={cn(
        "max-w-sm transform-none transition-all duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "bg-white border shadow-lg",
        isMobile ? "fixed left-4 right-4 top-20 m-0 w-auto" : "m-0"
      )}
      data-is-task-group={isTaskNotificationGroup ? "true" : "false"}
      data-is-test-group={isTestNotificationGroup ? "true" : "false"}
      data-group-id={groupId}>
        <AlertDialogTitle className="sr-only">Notifications</AlertDialogTitle>
        <AlertDialogDescription className="sr-only">
          Group of notifications requiring your attention
        </AlertDialogDescription>
        
        <div className="space-y-2">
          {sortedNotifications.map((notification) => (
            <NotificationContent key={notification.id} notification={notification} />
          ))}

          {isTaskNotificationGroup && (
            <NotificationButtons
              isLoading={isLoading}
              referenceId={referenceId}
              onDismiss={handleDismiss}
              isTestNotification={isTestNotificationGroup}
            />
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
