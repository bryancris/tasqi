
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
  reference_type?: string | null;
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
  reference_type,
}: AlertNotificationProps) {
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    console.log('🔍 EXACT Notification Details:', {
      title: `"${title}"`,
      titleLength: title.length,
      titleCharCodes: Array.from(title).map(c => c.charCodeAt(0)),
      message,
      type,
      referenceId,
      reference_type,
      allProps: { open, title, message, type, action, index, referenceId, reference_type }
    });
  }, [title, referenceId, reference_type, message, type, open, action, index]);

  const handleDone = async () => {
    try {
      setIsLoading('done');
      
      if (referenceId) {
        console.log('Processing task with ID:', referenceId);
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

  // Logic to determine if buttons should be shown
  // 1. If it's explicitly a task notification with reference_type='task'
  // 2. OR if it's a reminder notification with a reference ID (for backward compatibility)
  const isTaskNotification = reference_type === 'task' || 
                            (title.toLowerCase().includes('task') && 
                             title.toLowerCase().includes('reminder'));
  
  const showButtons = isTaskNotification && referenceId !== undefined && referenceId !== null;
  
  console.log('🔘 Enhanced button visibility check:', {
    title,
    showButtons,
    isTaskNotification,
    referenceType: reference_type,
    hasReferenceId: referenceId !== undefined && referenceId !== null,
    referenceIdType: typeof referenceId,
    referenceIdValue: referenceId
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
      >
        <button
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
