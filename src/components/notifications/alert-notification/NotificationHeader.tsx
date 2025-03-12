
import * as React from "react";
import { AlarmClock } from "lucide-react";
import { AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface NotificationHeaderProps {
  title: string;
  message: string;
  referenceId?: number | string | null;
}

export const NotificationHeader = ({ 
  title, 
  message, 
  referenceId 
}: NotificationHeaderProps) => {
  return (
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2 text-[#6D4AFF]">
        <AlarmClock className="h-5 w-5" />
        {title}
      </AlertDialogTitle>
      <AlertDialogDescription className="space-y-1">
        <div className="font-medium text-[#1A1F2C]">{message}</div>
        <div className="text-sm text-[#1A1F2C]/60">Inbox</div>
        {referenceId && (
          <div className="text-xs font-semibold text-[#1A1F2C]/70">
            Task ID: {referenceId}
          </div>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
  );
};
