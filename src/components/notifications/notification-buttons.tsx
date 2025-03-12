
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { handleSnooze } from "./notification-handlers";
import { toast } from "sonner";

interface NotificationButtonsProps {
  isLoading: string | null;
  referenceId: number | string | null | undefined;
  onDismiss: () => void;
  onDone: () => void;
  isDialogOpen?: boolean;
  isTestNotification?: boolean;
}

export const NotificationButtons = ({
  isLoading,
  referenceId,
  onDismiss,
  onDone,
  isDialogOpen = false,
  isTestNotification = false
}: NotificationButtonsProps) => {
  // Enhanced logging
  console.log('🔘 RENDERING NotificationButtons:', { 
    referenceId, 
    referenceIdType: typeof referenceId, 
    referenceIdValue: referenceId ? String(referenceId) : "undefined",
    isTestNotification
  });

  const [snoozeTime, setSnoozeTime] = useState<string>("15");
  const [isSnoozing, setIsSnoozing] = useState<boolean>(false);
  const completeButtonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  // Focus the complete button when dialog is open
  useEffect(() => {
    if (isDialogOpen && completeButtonRef.current) {
      // Small delay to ensure DOM is ready
      const focusTimer = setTimeout(() => {
        if (completeButtonRef.current) {
          completeButtonRef.current.focus();
          console.log('✓ Set focus on complete button');
        }
      }, 250);
      
      return () => clearTimeout(focusTimer);
    }
  }, [isDialogOpen]);

  const handleSnoozeClick = async () => {
    // Log exact reference ID value
    console.log('⏰ Snoozing task with ID:', referenceId, 
      'Type:', typeof referenceId, 
      'Value as string:', String(referenceId),
      'Is test notification:', isTestNotification);
    
    if (!referenceId) {
      console.error('Cannot snooze: No valid reference ID');
      return;
    }
    
    setIsSnoozing(true);
    
    try {
      // For test notifications, simulate success
      if (isTestNotification || String(referenceId) === "999999") {
        console.log('Test notification - simulating snooze');
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(`Test task snoozed for ${snoozeTime} minutes`);
        onDismiss();
      } else {
        await handleSnooze(referenceId, parseInt(snoozeTime), queryClient, onDismiss);
      }
    } catch (error) {
      console.error('Error snoozing task:', error);
      toast.error('Failed to snooze task');
    } finally {
      setIsSnoozing(false);
    }
  };

  // Additional debug log on mount
  useEffect(() => {
    console.log('🔔 NotificationButtons MOUNTED with referenceId:', 
      referenceId,
      'Type:', typeof referenceId,
      'String value:', String(referenceId),
      'isTestNotification:', isTestNotification
    );
  }, [referenceId, isTestNotification]);

  return (
    <div 
      className="flex w-full flex-col sm:flex-row justify-between gap-2"
      data-has-reference-id={referenceId ? "true" : "false"}
      data-reference-id={String(referenceId)}
      data-reference-id-type={typeof referenceId}
      data-test-notification={isTestNotification ? "true" : "false"}
      data-component="notification-buttons"
    >
      <div className="flex gap-2 items-center">
        <Select 
          value={snoozeTime} 
          onValueChange={setSnoozeTime} 
          disabled={!!isLoading || isSnoozing}
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
          disabled={!!isLoading || isSnoozing}
          className="text-[#1A1F2C]"
          tabIndex={0}
          aria-label="Snooze task"
        >
          {isSnoozing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Snoozing
            </>
          ) : (
            'Snooze'
          )}
        </Button>
      </div>

      <Button
        ref={completeButtonRef}
        variant="default"
        size="sm"
        onClick={onDone}
        disabled={!!isLoading || isSnoozing}
        className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
        tabIndex={0}
        aria-label="Complete task"
      >
        {isLoading === 'done' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          'Complete'
        )}
      </Button>
    </div>
  );
};
