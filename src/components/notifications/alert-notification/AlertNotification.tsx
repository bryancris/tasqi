
import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { X, Clock, Check, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationHeader } from "./NotificationHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isTaskNotification, setIsTaskNotification] = React.useState(false);
  const [isTestNotification, setIsTestNotification] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [isSnoozing, setIsSnoozing] = React.useState(false);
  const queryClient = useQueryClient();
  
  const snoozeOptions = [
    { label: "5 minutes", minutes: 5 },
    { label: "15 minutes", minutes: 15 },
    { label: "30 minutes", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "4 hours", minutes: 240 },
    { label: "Tomorrow", minutes: 24 * 60 }
  ];
  
  // Effect to determine the type of notification
  React.useEffect(() => {
    // Check if this is a task notification
    if (referenceType === 'task') {
      setIsTaskNotification(true);
    }
    
    // Check if this is a test notification
    if (referenceId === "999999" || referenceId === 999999) {
      setIsTestNotification(true);
      console.log('⚠️ TEST NOTIFICATION DETECTED - ID:', referenceId);
    }
    
    // Log when notification is actually displayed
    if (open) {
      console.log('🔔 NOTIFICATION IS OPEN:', {
        title,
        message,
        referenceId,
        referenceType
      });
    }
  }, [title, message, referenceId, referenceType, open]);

  // Direct handler functions
  const handleComplete = () => {
    console.log('✅ Complete button clicked for notification:', referenceId);
    setIsLoading('done');
    
    // Simulate a delay then dismiss
    setTimeout(() => {
      toast.success("Task completed");
      setIsLoading(null);
      onDismiss();
    }, 1000);
  };

  const handleSnooze = (minutes: number) => {
    console.log('⏰ Snooze button clicked for notification:', referenceId, 'minutes:', minutes);
    setIsSnoozing(true);
    
    let snoozeMessage = '';
    if (minutes === 24 * 60) {
      snoozeMessage = 'until tomorrow at 9:00 AM';
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      snoozeMessage = `for ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      snoozeMessage = `for ${minutes} minutes`;
    }
    
    // Simulate a delay then dismiss
    setTimeout(() => {
      toast.success(`Task snoozed ${snoozeMessage}`);
      setIsSnoozing(false);
      onDismiss();
    }, 1000);
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
        data-test-notification={isTestNotification ? "true" : "false"}
        data-task-notification={isTaskNotification ? "true" : "false"}
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

        {/* ALWAYS render task action buttons for task notifications */}
        {(isTaskNotification || isTestNotification) && (
          <div 
            className="flex w-full flex-col sm:flex-row justify-between gap-2 mt-4 border-t pt-3"
            data-has-reference-id={referenceId ? "true" : "false"}
            data-reference-id={String(referenceId)}
            data-component="notification-buttons"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={!!isLoading || isSnoozing}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#1A1F2C] flex items-center gap-2 w-full sm:w-auto"
                  tabIndex={0}
                  aria-label="Snooze task options"
                >
                  {isSnoozing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Snoozing
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Snooze
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white z-50">
                {snoozeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.minutes}
                    onClick={() => handleSnooze(option.minutes)}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="default"
              size="sm"
              onClick={handleComplete}
              disabled={!!isLoading || isSnoozing}
              className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white flex items-center gap-2"
              tabIndex={0}
              aria-label="Complete task"
            >
              {isLoading === 'done' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Complete
                </>
              )}
            </Button>
          </div>
        )}

        {/* Render custom action if provided and not a task notification */}
        {action && !isTaskNotification && !isTestNotification && (
          <div className="mt-4 flex justify-end">
            <Button onClick={action.onClick} className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white">
              {action.label}
            </Button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
