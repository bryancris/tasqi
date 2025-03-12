
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
  // Log component mount with note that it's been deprecated
  React.useEffect(() => {
    console.log('🧨 NOTIFICATION CONTENT MOUNTED BUT NOT USED:', { 
      title, 
      message, 
      referenceId,
      referenceType,
      isDialogOpen,
      type
    });
    
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'NotificationContent mount - DEPRECATED');
  }, [title, message, referenceId, referenceType, isDialogOpen, type]);

  // This component is no longer in use - we've moved to direct rendering in AlertNotification
  // Always return null - the buttons are now directly in AlertNotification
  return null;
}
