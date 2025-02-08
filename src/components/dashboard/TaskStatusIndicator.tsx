
import { Clock, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgencyColor } from "@/utils/taskColors";

interface TaskStatusIndicatorProps {
  status: 'scheduled' | 'unscheduled' | 'completed';
  time: string;
  rescheduleCount?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function TaskStatusIndicator({ status, time, rescheduleCount = 0, onClick }: TaskStatusIndicatorProps) {
  const isOverdue = () => {
    if (!time || status !== 'scheduled') return false;
    
    const [, endTime] = time.split(' - ');
    if (!endTime) return false;
    
    const [hours, minutes] = endTime.split(':').map(Number);
    const taskEndTime = new Date();
    taskEndTime.setHours(hours, minutes, 0, 0);
    
    return new Date() > taskEndTime;
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full cursor-pointer shadow-lg transition-colors",
        "ring-2 ring-white ring-opacity-100",
        status === 'unscheduled' ? 'bg-[#1EAEDB]' : 
        status === 'completed' ? 'bg-gray-500' :
        getUrgencyColor(time),
        isOverdue() && "animate-flash"
      )}
      onClick={onClick}
    >
      {status === 'unscheduled' || status === 'completed' ? (
        <Check className="h-4 w-4 text-white" />
      ) : rescheduleCount > 0 ? (
        <div className="flex items-center gap-1">
          <RotateCcw className="h-3 w-3 text-white" />
          <span className="text-xs font-medium text-white">{rescheduleCount}</span>
        </div>
      ) : (
        <Clock className="h-4 w-4 text-[#0FA0CE]" />
      )}
    </div>
  );
}
