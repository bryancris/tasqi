import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgencyColor } from "@/utils/taskColors";

interface TaskStatusIndicatorProps {
  status: 'scheduled' | 'unscheduled' | 'completed';
  time: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function TaskStatusIndicator({ status, time, onClick }: TaskStatusIndicatorProps) {
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
        status === 'unscheduled' ? 'bg-[#1EAEDB]' : 
        status === 'completed' ? 'bg-gray-500' :
        getUrgencyColor(time),
        isOverdue() && "animate-flash"
      )}
      onClick={onClick}
    >
      {status === 'unscheduled' || status === 'completed' ? (
        <Check className="h-4 w-4 text-white" />
      ) : (
        <Clock className="h-4 w-4 text-[#0FA0CE]" />
      )}
    </div>
  );
}