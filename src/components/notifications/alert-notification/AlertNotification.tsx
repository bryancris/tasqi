
import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { X, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationHeader } from "./NotificationHeader";
import { Button } from "@/components/ui/button";

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
  
  // Log notification render and details
  React.useEffect(() => {
    console.log('🔔 Alert Notification rendered:', {
      title,
      message,
      referenceId,
      type,
      isOpen: open
    });

    // Log when notification is actually displayed
    if (open) {
      console.log('⚠️ NOTIFICATION IS OPEN - ID:', referenceId);
    }
  }, [title, message, referenceId, type, open]);

  // SIMPLE placeholder button handlers with console logging
  const handleSnooze = () => {
    console.log('PLACEHOLDER Snooze clicked for notification:', referenceId);
  };

  const handleComplete = () => {
    console.log('PLACEHOLDER Complete clicked for notification:', referenceId);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
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
        data-reference-id={referenceId !== undefined && referenceId !== null ? String(referenceId) : "none"}
        data-reference-type={referenceType || "none"}
        onEscapeKeyDown={onDismiss}
        aria-modal="true"
        role="dialog"
        data-testid="alert-notification-content"
      >
        <button
          ref={closeButtonRef}
          onClick={onDismiss}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <NotificationHeader 
          title={title} 
          message={message} 
          referenceId={referenceId} 
        />

        {/* ALWAYS SHOW SIMPLE PLACEHOLDER BUTTONS */}
        <div className="mt-4 border-t pt-3" data-testid="placeholder-buttons">
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSnooze}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              <span>Snooze</span>
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={handleComplete}
              className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>Complete</span>
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
