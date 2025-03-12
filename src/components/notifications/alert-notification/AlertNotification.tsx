
import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationHeader } from "./NotificationHeader";
import { NotificationContent } from "./NotificationContent";

export interface AlertNotificationProps {
  open: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  index?: number;
  referenceId?: number | string | null;
  referenceType?: string | null;
}

export function AlertNotification({
  open,
  title,
  message,
  type = 'info',
  action,
  onDismiss,
  index = 0,
  referenceId,
  referenceType,
}: AlertNotificationProps) {
  const isMobile = useIsMobile();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dialogContentRef = React.useRef<HTMLDivElement>(null);

  // Track when dialog is fully open
  const [isFullyOpen, setIsFullyOpen] = React.useState(false);
  
  // Determine if this is a test notification - direct check, most reliable
  const isTestNotification = React.useMemo(() => {
    const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : '';
    const result = stringId === '999999';
    console.log(`🧪 AlertNotification - Direct Test ID check: "${stringId}" === "999999" => ${result}`);
    return result;
  }, [referenceId]);
  
  // Log every render with detailed information
  React.useEffect(() => {
    console.log('🔔 RENDERING AlertNotification:', {
      title,
      message,
      referenceId,
      referenceIdType: typeof referenceId,
      referenceIdValue: referenceId !== undefined && referenceId !== null ? String(referenceId) : "undefined/null",
      referenceType,
      isTaskRelated: title?.toLowerCase().includes('task') || referenceType === 'task',
      isTestNotification,
    });
    
    if (isTestNotification) {
      console.log('🎯 TEST NOTIFICATION DETECTED in AlertNotification - ID: 999999');
    }
  }, [title, message, referenceId, referenceType, isTestNotification]);

  // Handle focusing the close button when dialog opens
  React.useEffect(() => {
    if (open) {
      // Use a short delay to ensure the dialog has fully opened and rendered
      const timeoutId = setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
          setIsFullyOpen(true);
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        setIsFullyOpen(false);
      };
    }
  }, [open]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        ref={dialogContentRef}
        className={cn(
          "max-w-sm m-0 transform-none transition-all duration-300 ease-in-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "bg-white border shadow-lg relative",
          {
            'fixed right-4': !isMobile,
            'top-4': !isMobile && index === 0,
            'top-[4.5rem]': !isMobile && index === 1,
            'top-[9rem]': !isMobile && index === 2,
            'top-[13.5rem]': !isMobile && index === 3,
            'fixed left-4 right-4 w-auto max-w-[calc(100%-2rem)]': isMobile,
            'top-16': isMobile && index === 0,
            'top-32': isMobile && index === 1,
            'top-48': isMobile && index === 2,
            'top-64': isMobile && index === 3,
          },
          type === 'success' && 'border-l-4 border-l-[#9b87f5] bg-[#F8F7FF]',
          type === 'error' && 'border-l-4 border-l-[#D946EF] bg-[#FFF5F9]',
          type === 'warning' && 'border-l-4 border-l-[#FEC6A1] bg-[#FFFAF5]',
          type === 'info' && 'border-l-4 border-l-[#9b87f5] bg-[#F8F7FF]'
        )}
        // Set explicit data attributes for debugging
        data-test-notification={isTestNotification ? "true" : "false"}
        data-reference-id={referenceId !== undefined && referenceId !== null ? String(referenceId) : "none"}
        data-reference-type={referenceType || "none"}
        onEscapeKeyDown={onDismiss}
        aria-modal="true"
        role="dialog"
      >
        <button
          ref={closeButtonRef}
          onClick={onDismiss}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close notification"
          tabIndex={0}
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <NotificationHeader 
          title={title} 
          message={message} 
          referenceId={referenceId} 
        />

        <NotificationContent
          title={title}
          message={message}
          type={type}
          action={action}
          onDismiss={onDismiss}
          referenceId={referenceId}
          referenceType={referenceType}
          isDialogOpen={isFullyOpen}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
