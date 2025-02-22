
import { Button } from "@/components/ui/button";
import { Check, Play, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleSnooze, handleEdit, handleStart } from "./notification-handlers";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationButtonsProps {
  isLoading: string | null;
  referenceId: number | null;
  onDismiss: () => void;
  onDone: () => Promise<void>;
}

export function NotificationButtons({ 
  isLoading, 
  referenceId,
  onDismiss,
  onDone
}: NotificationButtonsProps) {
  const queryClient = useQueryClient();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!!isLoading}
            className="text-[#6D4AFF] border-[#9b87f5] hover:bg-[#F8F7FF] hover:text-[#6D4AFF]"
          >
            <Clock className="h-4 w-4 mr-1" />
            Snooze
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {[10, 30, 60, 24 * 60].map((minutes) => (
            <DropdownMenuItem 
              key={minutes} 
              onClick={() => handleSnooze(referenceId, minutes, queryClient, onDismiss)}
            >
              <Clock className="h-4 w-4 mr-2" />
              {minutes === 24 * 60 ? 'Tomorrow' : `${minutes} minutes`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        disabled={!!isLoading}
        onClick={onDone}
        className="text-[#6D4AFF] border-[#9b87f5] hover:bg-[#F8F7FF] hover:text-[#6D4AFF]"
      >
        {isLoading === 'done' ? (
          <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-[#6D4AFF] border-t-transparent" />
        ) : (
          <Check className="h-4 w-4 mr-1" />
        )}
        Done
      </Button>

      <Button
        size="sm"
        disabled={!!isLoading}
        onClick={() => handleStart(referenceId, queryClient, onDismiss)}
        className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
      >
        {isLoading === 'start' ? (
          <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Play className="h-4 w-4 mr-1" />
        )}
        Start
      </Button>
    </>
  );
}
