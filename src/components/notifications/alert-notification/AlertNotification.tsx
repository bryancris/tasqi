
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [snoozeTime, setSnoozeTime] = React.useState<string>("15");
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  // Track when dialog is fully open
  const [isFullyOpen, setIsFullyOpen] = React.useState(false);
  
  // SUPER SIMPLE TEST DETECTION - direct string comparison only
  const isTestNotification = React.useMemo(() => {
    return referenceId !== undefined && 
           referenceId !== null && 
           String(referenceId) === "999999";
  }, [referenceId]);
  
  React.useEffect(() => {
    console.log('🔔 Alert Notification render:', {
      title,
      message,
      referenceId: referenceId,
      referenceIdAsString: referenceId !== undefined && referenceId !== null ? String(referenceId) : "none",
      isTestNotification,
      type
    });
  }, [title, message, referenceId, type, isTestNotification]);

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

  // Handle snooze button click
  const handleSnoozeClick = () => {
    setIsLoading('snooze');
    
    // Simulate API call
    setTimeout(() => {
      console.log(`Snoozing task for ${snoozeTime} minutes`);
      toast.success(`Task snoozed for ${snoozeTime} minutes`);
      setIsLoading(null);
      onDismiss();
    }, 1000);
  };

  // Handle complete button click
  const handleCompleteClick = () => {
    setIsLoading('complete');
    
    // Simulate API call
    setTimeout(() => {
      console.log('Task completed');
      toast.success('Task completed successfully');
      setIsLoading(null);
      onDismiss();
    }, 1000);
  };

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

        {/* ALWAYS SHOW ACTION BUTTONS - Simplified approach */}
        <div className="mt-4 border-t pt-3">
          <div className="flex w-full flex-col sm:flex-row justify-between gap-2">
            <div className="flex gap-2 items-center">
              <Select 
                value={snoozeTime} 
                onValueChange={setSnoozeTime} 
                disabled={!!isLoading}
              >
                <SelectTrigger className="h-9 w-28 bg-white text-[#1A1F2C]" tabIndex={0}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Snooze time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="1440">Tomorrow</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSnoozeClick}
                disabled={isLoading !== null}
                className="text-[#1A1F2C]"
                tabIndex={0}
                aria-label="Snooze task"
                data-testid="snooze-button"
              >
                {isLoading === 'snooze' ? (
                  <>
                    <div className="h-4 w-4 border-2 border-[#1A1F2C] border-t-transparent rounded-full animate-spin mr-2" />
                    Snoozing
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Snooze
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleCompleteClick}
              disabled={isLoading !== null}
              className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
              tabIndex={0}
              aria-label="Complete task"
              data-testid="complete-button"
            >
              {isLoading === 'complete' ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
