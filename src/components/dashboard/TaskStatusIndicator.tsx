
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TaskStatusIndicatorProps {
  status: string;
  time?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  isUpdating?: boolean;
  rescheduleCount?: number;
}

export function TaskStatusIndicator({ 
  status, 
  time, 
  onClick, 
  className, 
  isUpdating = false, 
  rescheduleCount 
}: TaskStatusIndicatorProps) {
  const isCompleted = status === 'completed';

  return (
    <div 
      className={cn(
        "flex items-center justify-center relative", 
        className,
        isUpdating && "opacity-50 pointer-events-none",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {time && (
        <div className="absolute -top-6 right-0 text-xs whitespace-nowrap font-medium opacity-90">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> 
            <span>{time}</span>
          </div>
        </div>
      )}
      
      {rescheduleCount && rescheduleCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold">
          {rescheduleCount}
        </div>
      )}
      
      <div className={cn(
        "rounded-full p-1 transition-all duration-200",
        onClick && "hover:scale-110 hover:opacity-90",
        isUpdating && "animate-pulse"
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-white" />
        ) : (
          <Circle className="w-6 h-6 text-white" />
        )}
      </div>
    </div>
  );
}
