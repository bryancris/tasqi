
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isTestNotification } from "@/utils/notifications/debug-utils";
import { useTaskCompletion } from "@/hooks/notifications/use-task-completion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { handleSnooze } from "@/components/notifications/notification-handlers";

interface NotificationButtonsProps {
  isLoading: string | null;
  referenceId: number | string | null | undefined;
  onDismiss: () => void;
  isTestNotification?: boolean;
}

export const NotificationButtons = ({
  isLoading,
  referenceId,
  onDismiss,
  isTestNotification: isTest = false
}: NotificationButtonsProps) => {
  console.log('🔘 RENDERING NotificationButtons:', { 
    referenceId, 
    referenceIdType: typeof referenceId, 
    referenceIdValue: referenceId ? String(referenceId) : "undefined",
    isTest
  });

  const [isSnoozing, setIsSnoozing] = useState<boolean>(false);
  const { handleTaskComplete } = useTaskCompletion();
  const queryClient = useQueryClient();

  const snoozeOptions = [
    { label: "5 minutes", minutes: 5 },
    { label: "15 minutes", minutes: 15 },
    { label: "30 minutes", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "4 hours", minutes: 240 },
    { label: "Tomorrow", minutes: 24 * 60 }
  ];

  const handleSnoozeClick = async (minutes: number) => {
    console.log('⏰ Snooze clicked for notification:', referenceId, 'minutes:', minutes);
    if (!referenceId) return;
    
    setIsSnoozing(true);
    
    try {
      await handleSnooze(referenceId, minutes, queryClient, onDismiss);
    } catch (error) {
      console.error('Error snoozing task:', error);
      toast.error("Failed to snooze task");
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!referenceId) return;
    
    console.log('✅ Complete button clicked for notification with referenceId:', referenceId);
    
    if (isTest || isTestNotification(referenceId)) {
      setTimeout(() => {
        toast.success("Test task completed");
        onDismiss();
      }, 1000);
      return;
    }
    
    try {
      const task = { id: referenceId };
      await handleTaskComplete(task as any);
      toast.success("Task completed");
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Failed to complete task");
    } finally {
      onDismiss();
    }
  };

  return (
    <div 
      className="flex w-full flex-col sm:flex-row justify-between gap-2 mt-4 border-t pt-3"
      data-has-reference-id={referenceId ? "true" : "false"}
      data-reference-id={String(referenceId)}
      data-reference-id-type={typeof referenceId}
      data-test-notification={isTest ? "true" : "false"}
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
              onClick={() => handleSnoozeClick(option.minutes)}
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
        onClick={handleCompleteTask}
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
