
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface TaskStatusIndicatorProps {
  status: string;
  time?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  isUpdating?: boolean;
}

export function TaskStatusIndicator({ status, time, onClick, className, isUpdating = false }: TaskStatusIndicatorProps) {
  const isCompleted = status === 'completed';

  return (
    <div 
      className={cn(
        "flex items-center justify-center relative", 
        className,
        isUpdating && "opacity-50 pointer-events-none"
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
      
      <div className={cn(
        "rounded-full p-1 cursor-pointer",
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
