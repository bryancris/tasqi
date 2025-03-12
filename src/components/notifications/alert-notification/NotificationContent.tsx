
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { NotificationButtons } from "../notification-buttons";
import { toast } from "sonner";
import { handleStart } from "../notification-handlers";
import { debugLogNotification } from "@/utils/notifications/debug-utils";

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
  
  // SIMPLIFIED TEST ID CHECK: Direct comparison instead of complex function
  const isTestNotification = React.useMemo(() => {
    const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : '';
    const result = stringId === '999999';
    console.log(`⭐ DIRECT TEST ID CHECK in NotificationContent: "${stringId}" === "999999" => ${result}`);
    return result;
  }, [referenceId]);
  
  // On mount - always log properties and CLEARLY indicate if test notification
  React.useEffect(() => {
    console.log('🔴 NotificationContent MOUNT with:', {
      title,
      message,
      referenceId,
      referenceIdType: typeof referenceId, 
      referenceIdString: referenceId !== undefined && referenceId !== null ? String(referenceId) : "undefined/null",
      referenceType,
      isTestNotification,
      showingTaskButtons: isTestNotification ? "YES - TEST NOTIFICATION" : "Regular notification"
    });
    
    // Always log full notification details for debugging
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent mount');
    
    if (isTestNotification) {
      console.log('🎯 TEST NOTIFICATION (999999) DETECTED - WILL SHOW BUTTONS');
    }
  }, [title, message, referenceId, referenceType, isTestNotification]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
      // Special handling for test task notification
      if (isTestNotification) {
        console.log('✅ Test notification - simulating completion');
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Test task completed');
        onDismiss();
        return;
      }
      
      if (referenceId) {
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

  // COMPLETELY DIFFERENT APPROACH: Immediate check for test notification
  // This happens before any other logic - guaranteed to render buttons
  if (isTestNotification) {
    console.log('⭐ RENDERING TEST NOTIFICATION BUTTONS (ID: 999999)');
    
    return (
      <AlertDialogFooter 
        className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
        data-test-notification="true"
        data-reference-id={String(referenceId)}
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

  // For task notifications (regular path)
  const isTaskNotification = !!referenceId && 
    (referenceType === 'task' || title?.toLowerCase().includes('task'));

  return (
    <AlertDialogFooter 
      className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
      data-has-task-buttons={isTaskNotification ? "true" : "false"}
      data-test-notification="false"
      data-reference-id={referenceId ? String(referenceId) : "none"}
    >
      {isTaskNotification ? (
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
