
import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Notification } from "../types"; // Import the correct Notification type

interface NotificationContentProps {
  notification: Notification;
}

export const NotificationContent = ({ notification }: NotificationContentProps) => {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // IMPROVED: Better detection of "At start time" notification
  // Use === 0 check for more reliable detection
  const isAtStartTimeReminder = notification.data?.reminderTime === 0;
  
  // Add debug info to help trace the issue
  console.log('🚨 NotificationContent reminderTime value:', notification.data?.reminderTime);
  console.log('🚨 reminderTime type:', typeof notification.data?.reminderTime);
  console.log('🚨 Is "At start time"?', isAtStartTimeReminder ? 'YES' : 'NO');

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        notification.priority === 'high' && "bg-red-50 border-red-200",
        notification.priority === 'normal' && "bg-blue-50 border-blue-200",
        notification.priority === 'low' && "bg-gray-50 border-gray-200",
        !notification.priority && "bg-blue-50 border-blue-200" // Default styling
      )}
      data-reference-id={notification.referenceId || "none"}
      data-reference-type={notification.referenceType || "none"}
      data-at-start-time={isAtStartTimeReminder ? "true" : "false"}
      data-reminder-time={notification.data?.reminderTime || "none"}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        <div>
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
          {notification.referenceType === 'task' && notification.referenceId && (
            <div className="text-xs text-gray-500 mt-1">
              Task ID: {notification.referenceId}
              {isAtStartTimeReminder && (
                <span className="ml-2 text-emerald-600 font-medium">At start time</span>
              )}
              {!isAtStartTimeReminder && notification.data?.reminderTime && (
                <span className="ml-2 text-blue-600">
                  {notification.data.reminderTime} min before
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
