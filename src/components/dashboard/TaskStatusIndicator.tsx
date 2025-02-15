
import { Clock8, Check, CalendarDays, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = 'completed' | 'scheduled' | 'unscheduled' | 'in_progress' | 'stuck';

interface TaskStatusIndicatorProps {
  status: TaskStatus;
  time?: string;
  rescheduleCount?: number;
  onClick: (e: React.MouseEvent) => void;
}

export function TaskStatusIndicator({ status, time, rescheduleCount, onClick }: TaskStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'scheduled':
        return <Clock8 className="h-5 w-5 text-blue-500" />;
      case 'unscheduled':
        return <CalendarDays className="h-5 w-5 text-gray-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'stuck':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <CalendarDays className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full w-10 h-10",
        "hover:bg-gray-100 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      )}
    >
      {getStatusIcon()}
    </button>
  );
}
