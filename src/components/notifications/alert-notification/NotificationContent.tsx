
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
  
  // Check if this is a test notification - most critical check
  const isTestNotificationInstance = isTestNotification(referenceId);
  
  // Enhanced debugging on render
  React.useEffect(() => {
    console.log('🔴 NotificationContent rendering with:', {
      referenceId,
      referenceIdType: typeof referenceId,
      referenceIdValue: referenceId ? String(referenceId) : "undefined/null",
      referenceType,
      title,
      isDialogOpen,
      isTestNotification: isTestNotificationInstance
    });
    
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent render');
  }, [title, message, type, referenceId, referenceType, isDialogOpen, isTestNotificationInstance]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
      // Special handling for test task notification
      if (isTestNotificationInstance) {
        console.log('✅ Test notification - simulating completion');
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

  // For debugging - let's explicitly log the decision process
  const showButtons = isTestNotificationInstance || 
    (referenceId !== undefined && referenceId !== null && 
     (referenceType === 'task' || title?.toLowerCase().includes('task')));
  
  console.log('🔍 NotificationContent Button Decision:', {
    isTestNotification: isTestNotificationInstance,
    hasReferenceId: referenceId !== undefined && referenceId !== null,
    isTaskType: referenceType === 'task',
    hasTitleWithTask: title?.toLowerCase().includes('task'),
    finalDecision: showButtons,
    referenceId,
    referenceIdType: typeof referenceId
  });

  // ALWAYS render buttons for test notifications
  if (isTestNotificationInstance) {
    console.log('🧪 TEST NOTIFICATION - FORCING BUTTONS DISPLAY');
    
    return (
      <AlertDialogFooter 
        className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
        data-has-task-buttons="true"
        data-test-notification="true"
      >
        <NotificationButtons
          isLoading={isLoading}
          referenceId={referenceId}
          onDismiss={onDismiss}
          onDone={handleDone}
          isDialogOpen={isDialogOpen}
          isTestNotification={true}
        />
      </AlertDialogFooter>
    );
  }

  // For regular notifications
  return (
    <AlertDialogFooter 
      className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
      data-has-task-buttons={showButtons ? "true" : "false"}
      data-test-notification={isTestNotificationInstance ? "true" : "false"}
    >
      {showButtons ? (
        <NotificationButtons
          isLoading={isLoading}
          referenceId={referenceId}
          onDismiss={onDismiss}
          onDone={handleDone}
          isDialogOpen={isDialogOpen}
          isTestNotification={false}
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
