
import { cn } from "@/lib/utils";
import { Check, CheckCircle, Clock } from "lucide-react";

interface TaskStatusIndicatorProps {
  status: string;
  time?: string | null;
  rescheduleCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

export function TaskStatusIndicator({ status, time, rescheduleCount = 0, onClick }: TaskStatusIndicatorProps) {
  const renderIcon = () => {
    if (status === 'completed') {
      return (
        <div 
          onClick={onClick}
          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    }

    if (status === 'unscheduled') {
      return (
        <div 
          onClick={onClick}
          className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div 
        onClick={onClick}
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center cursor-pointer",
          "text-white/80 hover:text-white transition-colors"
        )}
      >
        <Clock className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center">
      {renderIcon()}
    </div>
  );
}
