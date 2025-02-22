
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AlarmClock, Check, Play, Clock, Edit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

export function AlertNotification({
  open,
  title,
  message,
  type = 'info',
  action,
  onDismiss,
  index = 0,
}: AlertNotificationProps) {
  const isMobile = useIsMobile();

  const handleSnooze = (minutes: number) => {
    console.log('Snoozing for', minutes, 'minutes');
    // Implementation for snooze functionality would go here
  };

  const handleEdit = () => {
    console.log('Edit task');
    // Implementation for edit functionality would go here
  };

  const handleDone = () => {
    if (action?.onClick) {
      action.onClick();
    }
  };

  const handleStart = () => {
    console.log('Start task');
    // Implementation for start functionality would go here
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className={cn(
          "max-w-sm m-0 transform-none transition-all duration-300 ease-in-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "bg-white border shadow-lg",
          {
            // Desktop positioning
            'fixed right-4': !isMobile,
            'top-4': !isMobile && index === 0,
            'top-[4.5rem]': !isMobile && index === 1,
            'top-[9rem]': !isMobile && index === 2,
            'top-[13.5rem]': !isMobile && index === 3,
            // Mobile positioning
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
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[#6D4AFF]">
            <AlarmClock className="h-5 w-5" />
            Task Reminder
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1">
            <div className="font-medium text-[#1A1F2C]">{message}</div>
            <div className="text-sm text-[#1A1F2C]/60">Inbox</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-start gap-2 sm:gap-2 mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-[#6D4AFF] border-[#9b87f5] hover:bg-[#F8F7FF] hover:text-[#6D4AFF]"
              >
                <Clock className="h-4 w-4 mr-1" />
                Snooze
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => handleSnooze(10)}>
                <Clock className="h-4 w-4 mr-2" />
                10 minutes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(30)}>
                <Clock className="h-4 w-4 mr-2" />
                30 minutes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(60)}>
                <Clock className="h-4 w-4 mr-2" />
                60 minutes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSnooze(24 * 60)}>
                <Clock className="h-4 w-4 mr-2" />
                Tomorrow
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDismiss}>
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDone}
            className="text-[#6D4AFF] border-[#9b87f5] hover:bg-[#F8F7FF] hover:text-[#6D4AFF]"
          >
            <Check className="h-4 w-4 mr-1" />
            Done
          </Button>
          <Button
            size="sm"
            onClick={handleStart}
            className="bg-[#9b87f5] hover:bg-[#8B5CF6] text-white"
          >
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
