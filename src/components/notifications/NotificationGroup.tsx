
import { cn } from "@/lib/utils";
import { useNotifications } from "./context/NotificationsContext";
import { Check, AlertTriangle, AlertCircle, Info, Clock, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "../ui/alert-dialog";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { debugLogNotification, validateTaskNotification, isTestNotification } from "@/utils/notifications/debug-utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTaskCompletion } from "@/hooks/notifications/use-task-completion";

interface NotificationGroupProps {
  groupId: string;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'high' | 'normal' | 'low';
    referenceId?: string | number | null;   
    referenceType?: string | null;         
  }>;
  onDismissGroup: (groupId: string) => void;
}

export function NotificationGroup({ groupId, notifications, onDismissGroup }: NotificationGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();
  const { handleTaskComplete } = useTaskCompletion();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isSnoozing, setIsSnoozing] = useState(false);

  // Debug log to understand the actual notifications being rendered
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

  // Debug log the first notification in this group
  if (notifications.length > 0) {
    debugLogNotification(notifications[0], `NotificationGroup (${groupId})`);
    // Check if the notification should show action buttons
    const shouldShowButtons = validateTaskNotification(notifications[0]);
    console.log(`🔘 Should show buttons: ${shouldShowButtons} for group ${groupId}`);
  }

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

  // Check if this is a task notification group
  const isTaskNotificationGroup = notifications.some(notification => 
    notification.referenceType === 'task' && notification.referenceId
  );

  // Check if this is a test notification group
  const isTestNotificationGroup = notifications.some(notification =>
    notification.referenceId === "999999" || notification.referenceId === 999999
  );

  const handleSnoozeTask = () => {
    console.log('⏰ Snooze clicked for notification group:', groupId);
    setIsSnoozing(true);
    
    // Simulate a delay then dismiss
    setTimeout(() => {
      toast.success(`Task snoozed for 15 minutes`);
      setIsSnoozing(false);
      handleDismiss();
    }, 1000);
  };

  const handleCompleteTask = async () => {
    if (notifications.length === 0) return;
    
    // Get the first notification's reference ID
    const notification = notifications[0];
    const referenceId = notification.referenceId;
    
    console.log('✅ Complete button clicked for notification with referenceId:', referenceId);
    setIsLoading('done');
    
    // Handle test notification differently
    if (isTestNotification(referenceId)) {
      setTimeout(() => {
        toast.success("Test task completed");
        setIsLoading(null);
        handleDismiss();
      }, 1000);
      return;
    }
    
    // Handle real task completion
    try {
      if (typeof referenceId === 'string' || typeof referenceId === 'number') {
        // Create a simple task object with the ID for handleTaskComplete
        const task = { id: referenceId };
        await handleTaskComplete(task as any);
        toast.success("Task completed");
      } else {
        toast.error("Could not identify task to complete");
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Failed to complete task");
    } finally {
      setIsLoading(null);
      handleDismiss();
    }
  };

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
            <div
              key={notification.id}
              className={cn(
                "p-3 rounded-lg border",
                notification.priority === 'high' && "bg-red-50 border-red-200",
                notification.priority === 'normal' && "bg-blue-50 border-blue-200",
                notification.priority === 'low' && "bg-gray-50 border-gray-200"
              )}
              data-reference-id={notification.referenceId || "none"}
              data-reference-type={notification.referenceType || "none"}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  {notification.referenceType === 'task' && notification.referenceId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Task ID: {notification.referenceId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Always show buttons for task notification groups */}
          {isTaskNotificationGroup && (
            <div className="flex w-full flex-col sm:flex-row justify-between gap-2 mt-4 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSnoozeTask}
                disabled={!!isLoading || isSnoozing}
                className="text-[#1A1F2C] flex items-center gap-2"
                tabIndex={0}
                aria-label="Snooze task"
              >
                {isSnoozing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Snoozing
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    Snooze
                  </>
                )}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleCompleteTask}
                disabled={!!isLoading || isSnoozing}
                className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white flex items-center gap-2"
                tabIndex={0}
                aria-label="Complete task"
              >
                {isLoading === 'done' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
