
import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { AlarmClock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { NotificationButtons } from "./notification-buttons";
import { useQueryClient } from "@tanstack/react-query";
import { handleStart } from "./notification-handlers";
import { debugLogNotification, validateTaskNotification } from "@/utils/notifications/debug-utils";

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
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    debugLogNotification({
      title,
      message,
      type,
      referenceId,
      referenceType,
    }, 'AlertNotification render');
    
    const validation = validateTaskNotification({
      title,
      referenceId,
      referenceType
    });
    
    console.log('📋 Alert Notification Properties:', {
      title,
      message,
      type,
      referenceId,
      referenceIdType: typeof referenceId,
      referenceIdValue: String(referenceId),
      referenceType,
      referenceTypeValue: referenceType
    });
    
  }, [title, message, type, referenceId, referenceType]);

  React.useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        buttonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

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

  // Simplified logic - show buttons if this is a task and has any sort of referenceId
  // We've struggled with the type checking, so let's make it very simple
  console.log('🎯 Should show buttons? Checking:', {
    title,
    referenceId,
    referenceType,
    referenceIdExists: referenceId !== undefined && referenceId !== null
  });
  
  // Remove strict type checking that might be causing issues
  const showButtons = (
    // Either has referenceType === 'task'
    (referenceType === 'task' || 
    // Or has 'task' in the title
    (title && title.toLowerCase().includes('task'))) && 
    // AND has some value for referenceId (not null/undefined)
    (referenceId !== undefined && referenceId !== null)
  );
  
  console.log('🔘 FINAL BUTTON DECISION:', {
    showButtons,
    reason: showButtons ? 
      'SHOWING BUTTONS ✅' : 
      'HIDING BUTTONS ❌ - Failed condition check'
  });

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
        onEscapeKeyDown={onDismiss}
      >
        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[#6D4AFF]">
            <AlarmClock className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <div className="font-medium text-[#1A1F2C]">{message}</div>
            <div className="text-sm text-[#1A1F2C]/60">Inbox</div>
            {referenceId && (
              <div className="text-xs font-semibold text-[#1A1F2C]/70">
                Task ID: {referenceId}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-col gap-3 sm:gap-3 mt-2 items-start">
          {showButtons && (
            <NotificationButtons
              isLoading={isLoading}
              referenceId={referenceId}
              onDismiss={onDismiss}
              onDone={handleDone}
            />
          )}
          {!showButtons && action && (
            <div className="flex justify-end w-full">
              <button
                onClick={action.onClick}
                className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white px-4 py-2 rounded"
              >
                {action.label}
              </button>
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
