
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { handleSnooze } from "./notification-handlers";

interface NotificationButtonsProps {
  isLoading: string | null;
  referenceId: number | string | null | undefined;
  onDismiss: () => void;
  onDone: () => void;
}

export const NotificationButtons = ({
  isLoading,
  referenceId,
  onDismiss,
  onDone
}: NotificationButtonsProps) => {
  console.log('📣 RENDERING NotificationButtons component with:', {
    isLoading,
    referenceId,
    referenceIdType: typeof referenceId,
    referenceIdValue: String(referenceId)
  });

  const [snoozeTime, setSnoozeTime] = useState<string>("15");
  const [isSnoozing, setIsSnoozing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔧 NotificationButtons mounted with referenceId:', referenceId);
  }, [referenceId]);

  const handleSnoozeClick = async () => {
    if (referenceId === undefined || referenceId === null) {
      console.error('Cannot snooze: No valid reference ID');
      return;
    }
    
    console.log('⏰ Snoozing task with ID:', referenceId, 'for', snoozeTime, 'minutes');
    setIsSnoozing(true);
    try {
      await handleSnooze(referenceId, parseInt(snoozeTime), queryClient, onDismiss);
    } catch (error) {
      console.error('Error snoozing task:', error);
    } finally {
      setIsSnoozing(false);
    }
  };

  return (
    <div className="flex w-full flex-col sm:flex-row justify-between gap-2">
      <div className="flex gap-2 items-center">
        <Select 
          value={snoozeTime} 
          onValueChange={setSnoozeTime} 
          disabled={!!isLoading || isSnoozing}
        >
          <SelectTrigger className="h-9 w-28 bg-white text-[#1A1F2C]">
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
        variant="default"
        size="sm"
        onClick={onDone}
        disabled={!!isLoading || isSnoozing}
        className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
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
