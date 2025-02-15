
import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { Bell } from "lucide-react";

interface WeeklyTaskCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

export function WeeklyTaskCard({ task, onClick, onComplete, dragHandleProps, extraButton }: WeeklyTaskCardProps) {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600";
      case "medium":
        return "bg-orange-500 hover:bg-orange-600";
      case "low":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  return (
    <div
      {...dragHandleProps}
      onClick={onClick}
      className={cn(
        "h-full w-full",
        "cursor-pointer",
        "text-white text-xs leading-tight",
        "shadow-sm",
        "rounded-md",
        "flex overflow-hidden",
        getPriorityColor(task.priority)
      )}
    >
      <div className="p-1 flex-1 overflow-hidden">
        <div className="flex items-center gap-1">
          <div className="font-medium truncate flex-1">{task.title}</div>
          <div className="flex items-center gap-1 shrink-0">
            {task.reminder_enabled && <Bell className="w-3 h-3" />}
            {extraButton}
          </div>
        </div>
        {task.description && (
          <p className="text-[10px] text-white/90 truncate">{task.description}</p>
        )}
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full shrink-0" />
      )}
    </div>
  );
}
