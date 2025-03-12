
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
  
  // Check if this is a test notification (ID 999999)
  const isTestNotification = React.useMemo(() => {
    // Convert referenceId to string for comparison
    const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : "";
    const result = stringId === "999999";
    
    console.log(`🔍 TEST CHECK: referenceId=${stringId}, isTest=${result}, type=${typeof referenceId}`);
    
    return result;
  }, [referenceId]);

  // Log notification details for debugging
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

  // Always return null from this component - we're not using it anymore
  // This ensures it doesn't interfere with the direct rendering in AlertNotification
  return null;
}
