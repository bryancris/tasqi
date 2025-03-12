
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
  
  // New: DIRECT test ID check without any complex logic
  const isTestNotification = React.useMemo(() => {
    // Convert referenceId to string for comparison
    const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : "";
    const result = stringId === "999999";
    
    console.log(`🔍 TEST CHECK: referenceId=${stringId}, isTest=${result}, type=${typeof referenceId}`);
    
    return result;
  }, [referenceId]);

  // Log complete notification details for debugging
  React.useEffect(() => {
    console.log('🧨 NOTIFICATION CONTENT MOUNTED:', { 
      title, 
      message, 
      referenceId,
      referenceType,
      isTestNotification,
      isDialogOpen,
      type
    });
    
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent mount');
  }, [title, message, referenceId, referenceType, isTestNotification, isDialogOpen, type]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
      // Special handling for test notification
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

  // NEW APPROACH: SEPARATE RENDER PATH FOR TEST NOTIFICATIONS
  // This guarantees test notifications always show buttons
  if (isTestNotification) {
    console.log('🚨 RENDERING TEST NOTIFICATION BUTTONS - ID: 999999');
    
    return (
      <AlertDialogFooter 
        className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
        data-testid="test-notification-buttons"
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

  // Regular task notifications path
  const isTaskNotification = !!referenceId && 
    (referenceType === 'task' || title?.toLowerCase().includes('task'));
  
  console.log('🔄 Regular notification - showing task buttons?', isTaskNotification);

  return (
    <AlertDialogFooter 
      className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start"
      data-has-task-buttons={isTaskNotification ? "true" : "false"}
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
