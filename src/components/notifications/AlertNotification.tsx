
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
}

export function AlertNotification({
  open,
  title,
  message,
  type = 'info',
  action,
  onDismiss,
}: AlertNotificationProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className={cn(
          "fixed top-4 right-4 left-4 max-w-sm m-0 transform-none transition-transform duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4",
          "sm:right-4 sm:left-auto",
          type === 'success' && 'border-l-4 border-l-green-500',
          type === 'error' && 'border-l-4 border-l-red-500',
          type === 'warning' && 'border-l-4 border-l-yellow-500',
          type === 'info' && 'border-l-4 border-l-blue-500'
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-0">
          {action && (
            <AlertDialogAction
              onClick={action.onClick}
              className="px-3 py-2"
            >
              {action.label}
            </AlertDialogAction>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
