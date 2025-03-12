
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { NotificationButtons } from "../notification-buttons";
import { toast } from "sonner";
import { handleStart } from "../notification-handlers";
import { 
  debugLogNotification, 
  validateTaskNotification, 
  isTestNotification 
} from "@/utils/notifications/debug-utils";

interface NotificationContentProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  referenceId?: number | string | null;
  referenceType?: string | null;
  isDialogOpen?: boolean;
}

export const NotificationContent = ({
  title,
  message,
  type = 'info',
  action,
  onDismiss,
  referenceId,
  referenceType,
  isDialogOpen = false,
}: NotificationContentProps) => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // SIMPLIFIED: Log details on render
  React.useEffect(() => {
    console.log('🔴 NotificationContent rendering with:', {
      referenceId,
      referenceIdType: typeof referenceId,
      referenceIdValue: String(referenceId),
      referenceType,
      title,
      isDialogOpen,
      isTest: isTestNotification(referenceId)
    });
    
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent render');
  }, [title, message, type, referenceId, referenceType, isDialogOpen]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
      // Special handling for test task notification
      if (isTestNotification(referenceId)) {
        console.log('Test notification - simulating completion');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        toast.success('Test task completed');
        onDismiss();
        return;
      }
      
      if (referenceId) {
        console.log('Processing task with ID:', referenceId, 'Type:', typeof referenceId);
        await handleStart(referenceId, queryClient, onDismiss);
      } else if (action?.onClick) {
        await action.onClick();
      }
      
      onDismiss();
    } catch (error) {
      console.error('Error handling task:', error);
      toast.error('Failed to process task');
    } finally {
      setIsLoading(null);
    }
  };

  // FORCED TEST NOTIFICATION CHECK:
  // Always check for test notification first, and if it's a test notification (999999),
  // always render buttons regardless of other conditions
  const forceButtonsForTestNotification = isTestNotification(referenceId);

  console.log('🧪 Button display decision:', {
    forceButtonsForTestNotification,
    referenceId,
    referenceIdValue: String(referenceId),
    referenceIdType: typeof referenceId,
    isTestNotification: isTestNotification(referenceId)
  });

  // If this is a test notification, always show buttons
  if (forceButtonsForTestNotification) {
    console.log('🧪 TEST NOTIFICATION DETECTED - FORCING BUTTONS TO DISPLAY');
    
    return (
      <AlertDialogFooter 
        className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
        data-has-task-buttons="true"
        data-test-notification="true"
        data-forced-buttons="true"
      >
        <NotificationButtons
          isLoading={isLoading}
          referenceId={referenceId}
          onDismiss={onDismiss}
          onDone={handleDone}
          isDialogOpen={isDialogOpen}
        />
      </AlertDialogFooter>
    );
  }

  // For regular notifications
  const isTaskNotification = validateTaskNotification({
    title,
    message,
    type,
    referenceId,
    referenceType,
  });
  
  return (
    <AlertDialogFooter 
      className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
      data-has-task-buttons={isTaskNotification ? "true" : "false"}
      data-test-notification={isTestNotification(referenceId) ? "true" : "false"}
    >
      {isTaskNotification ? (
        <NotificationButtons
          isLoading={isLoading}
          referenceId={referenceId}
          onDismiss={onDismiss}
          onDone={handleDone}
          isDialogOpen={isDialogOpen}
        />
      ) : action ? (
        <div className="flex justify-end w-full">
          <button
            onClick={action.onClick}
            className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded"
            tabIndex={0}
          >
            {action.label}
          </button>
        </div>
      ) : null}
    </AlertDialogFooter>
  );
};
