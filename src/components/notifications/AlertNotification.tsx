
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
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
            // Mobile positioning - center in viewport with safe area padding
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
          <AlertDialogTitle className={cn(
            "font-semibold",
            type === 'success' && 'text-[#6D4AFF]',
            type === 'error' && 'text-[#D946EF]',
            type === 'warning' && 'text-[#F97316]',
            type === 'info' && 'text-[#6D4AFF]'
          )}>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#1A1F2C]">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-0">
          {action && (
            <AlertDialogAction
              onClick={action.onClick}
              className={cn(
                "px-3 py-2 text-white",
                type === 'success' && 'bg-[#9b87f5] hover:bg-[#8B5CF6]',
                type === 'error' && 'bg-[#D946EF] hover:bg-[#D946EF]/90',
                type === 'warning' && 'bg-[#FEC6A1] hover:bg-[#F97316]',
                type === 'info' && 'bg-[#9b87f5] hover:bg-[#8B5CF6]'
              )}
            >
              {action.label}
            </AlertDialogAction>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto px-2 hover:bg-[#F8F7FF] text-[#1A1F2C]/60 hover:text-[#1A1F2C]"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
