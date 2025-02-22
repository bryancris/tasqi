
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
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className={cn(
          "fixed right-4 max-w-sm m-0 transform-none transition-all duration-300 ease-in-out",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4",
          {
            'top-4': index === 0,
            'top-[4.5rem]': index === 1,
            'top-[9rem]': index === 2,
            'top-[13.5rem]': index === 3,
          },
          type === 'success' && 'border-l-4 border-l-green-500 bg-green-50/50',
          type === 'error' && 'border-l-4 border-l-red-500 bg-red-50/50',
          type === 'warning' && 'border-l-4 border-l-yellow-500 bg-yellow-50/50',
          type === 'info' && 'border-l-4 border-l-blue-500 bg-blue-50/50'
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(
            type === 'success' && 'text-green-700',
            type === 'error' && 'text-red-700',
            type === 'warning' && 'text-yellow-700',
            type === 'info' && 'text-blue-700'
          )}>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-0">
          {action && (
            <AlertDialogAction
              onClick={action.onClick}
              className={cn(
                "px-3 py-2",
                type === 'success' && 'bg-green-500 hover:bg-green-600',
                type === 'error' && 'bg-red-500 hover:bg-red-600',
                type === 'warning' && 'bg-yellow-500 hover:bg-yellow-600',
                type === 'info' && 'bg-blue-500 hover:bg-blue-600'
              )}
            >
              {action.label}
            </AlertDialogAction>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto px-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
