import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgencyColor } from "@/utils/taskColors";

interface TaskStatusIndicatorProps {
  status: 'scheduled' | 'unscheduled';
  time: string;
  onClick?: () => void;
}

export function TaskStatusIndicator({ status, time, onClick }: TaskStatusIndicatorProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full cursor-pointer shadow-lg",
        status === 'unscheduled' ? 'bg-white/20' : getUrgencyColor(time)
      )}
      onClick={status === 'unscheduled' ? onClick : undefined}
    >
      {status === 'unscheduled' ? (
        <Check className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4 text-white" />
      )}
    </div>
  );
}