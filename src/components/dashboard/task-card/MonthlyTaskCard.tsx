
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Bell } from "lucide-react";

interface MonthlyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

function MonthlyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: MonthlyTaskCardProps) {
  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };
  
  const timeDisplay = getTimeDisplay();
  
  return (
    <div 
      className={cn(
        "text-xs p-2 rounded-md cursor-pointer",
        "text-white truncate",
        "relative overflow-hidden",
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate flex-1">{task.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {task.reminder_enabled && (
            <Bell className="h-3 w-3 text-white/80" />
          )}
          {extraButton}
        </div>
      </div>
      {timeDisplay && (
        <p className="text-[10px] text-white/90 truncate">{timeDisplay}</p>
      )}
      {task.shared && (
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#9b87f5]" />
      )}
    </div>
  );
}

export const MonthlyTaskCard = memo(MonthlyTaskCardComponent);
