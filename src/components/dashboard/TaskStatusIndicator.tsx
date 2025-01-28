import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgencyColor } from "@/utils/taskColors";

interface TaskStatusIndicatorProps {
  status: 'scheduled' | 'unscheduled';
  time: string;
  onClick?: () => void;
}

export function TaskStatusIndicator({ status, time, onClick }: TaskStatusIndicatorProps) {
  const isOverdue = () => {
    if (!time || status === 'unscheduled') return false;
    
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
        status === 'unscheduled' ? 'bg-[#1EAEDB]' : getUrgencyColor(time),
        isOverdue() && "animate-flash"
      )}
      onClick={onClick}
    >
      {status === 'unscheduled' ? (
        <Check className="h-4 w-4 text-white" />
      ) : (
        <Clock className="h-4 w-4 text-[#0FA0CE]" />
      )}
    </div>
  );
}