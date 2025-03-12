
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Check } from "lucide-react";
import { useState } from "react";
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
  // Enhanced logging to debug the component rendering
  console.log('🔘 RENDERING NotificationButtons:', { 
    referenceId, 
    referenceIdType: typeof referenceId, 
    referenceIdValue: referenceId ? String(referenceId) : "undefined",
    isTestNotification,
    isDialogOpen
  });

  const [snoozeTime, setSnoozeTime] = useState<string>("15");
  const [isSnoozing, setIsSnoozing] = useState<boolean>(false);

  const handleSnoozeClick = () => {
    console.log('⏰ Snooze clicked for notification:', referenceId);
    setIsSnoozing(true);
    
    // Simple simulation for demonstration
    setTimeout(() => {
      toast.success(`Task snoozed for ${snoozeTime} minutes`);
      setIsSnoozing(false);
      onDismiss();
    }, 1000);
  };

  // Simple buttons that always render
  return (
    <div 
      className="flex w-full flex-col sm:flex-row justify-between gap-2 mt-4 border-t pt-3"
      data-has-reference-id={referenceId ? "true" : "false"}
      data-reference-id={String(referenceId)}
      data-reference-id-type={typeof referenceId}
      data-test-notification={isTestNotification ? "true" : "false"}
      data-component="notification-buttons"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleSnoozeClick}
        disabled={!!isLoading || isSnoozing}
        className="text-[#1A1F2C] flex items-center gap-2"
        tabIndex={0}
        aria-label="Snooze task"
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
          </>
        )}
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={onDone}
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
  );
};
