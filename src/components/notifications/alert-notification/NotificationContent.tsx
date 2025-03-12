
import * as React from "react";

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

// This component is completely deprecated now - we've moved all functionality directly to AlertNotification
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
  // Log component mount so we know if it's still being used
  React.useEffect(() => {
    console.log('🛑 DEPRECATED NotificationContent mounted but should not be used:', { 
      title, 
      message, 
      referenceId,
      referenceType
    });
  }, [title, message, referenceId, referenceType]);

  // Always return null - we're not using this component anymore
  return null;
}
