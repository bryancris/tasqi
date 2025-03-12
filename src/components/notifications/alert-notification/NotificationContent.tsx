
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { NotificationButtons } from "../notification-buttons";
import { toast } from "sonner";
import { handleStart } from "../notification-handlers";
import { debugLogNotification, validateTaskNotification } from "@/utils/notifications/debug-utils";

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
}

export const NotificationContent = ({
  title,
  message,
  type = 'info',
  action,
  onDismiss,
  referenceId,
  referenceType,
}: NotificationContentProps) => {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    console.log('🔍 NotificationContent rendering with:', {
      referenceId,
      referenceIdType: typeof referenceId,
      referenceIdValue: String(referenceId),
      referenceType,
      title
    });
    
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent render');
  }, [title, message, type, referenceId, referenceType]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
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

  // SIMPLIFIED BUTTON LOGIC - This is the key change
  // Only check for a valid reference ID (non-null, non-undefined)
  // For demo/test notifications, we'll show buttons for any notification with referenceId
  const hasReferenceId = referenceId !== undefined && referenceId !== null;
  
  // If this is a task notification OR has the word "task" in the title, and has a reference ID, show the buttons
  const isTaskRelated = referenceType === 'task' || title?.toLowerCase().includes('task');
  
  // Final decision for showing buttons - simplified logic
  const showButtons = hasReferenceId && isTaskRelated;
  
  console.log('📢 SIMPLIFIED Button display decision:', {
    hasReferenceId,
    isTaskRelated,
    showButtons,
    referenceId,
    referenceIdType: typeof referenceId,
    referenceIdValue: String(referenceId),
    title,
  });

  // Run validation on the notification for detailed logs
  if (referenceId !== undefined) {
    const validation = validateTaskNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    });
    console.log('🧪 NotificationContent validation:', validation);
  }

  return (
    <AlertDialogFooter className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start">
      {showButtons ? (
        <NotificationButtons
          isLoading={isLoading}
          referenceId={referenceId}
          onDismiss={onDismiss}
          onDone={handleDone}
        />
      ) : action ? (
        <div className="flex justify-end w-full">
          <button
            onClick={action.onClick}
            className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded"
          >
            {action.label}
          </button>
        </div>
      ) : null}
    </AlertDialogFooter>
  );
};
