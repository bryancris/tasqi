
import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface NotificationContentProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'high' | 'normal' | 'low';
    referenceId?: string | number | null;   
    referenceType?: string | null;         
  };
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

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        notification.priority === 'high' && "bg-red-50 border-red-200",
        notification.priority === 'normal' && "bg-blue-50 border-blue-200",
        notification.priority === 'low' && "bg-gray-50 border-gray-200"
      )}
      data-reference-id={notification.referenceId || "none"}
      data-reference-type={notification.referenceType || "none"}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        <div>
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
          {notification.referenceType === 'task' && notification.referenceId && (
            <div className="text-xs text-gray-500 mt-1">
              Task ID: {notification.referenceId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
