
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

export function MonthlyTaskCard({ task, onComplete, onClick, dragHandleProps, extraButton }: MonthlyTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';
  
  return (
    <div 
      className={cn(
        "flex items-start bg-white rounded-md shadow-sm relative",
        "hover:shadow-md transition-shadow cursor-pointer",
        "overflow-hidden",
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <div className="flex-1 p-2 min-w-0">
        <TaskStatusIndicator 
          status={task.status}
          time={timeString}
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }} 
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate text-sm flex-1">{task.title}</h3>
            <div className="flex items-center gap-1">
              {task.reminder_enabled && (
                <Bell className="w-3 h-3 shrink-0 text-gray-500" />
              )}
              {extraButton}
            </div>
          </div>
          {timeString && (
            <p className="text-xs text-gray-500">{timeString}</p>
          )}
        </div>
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0" />
      )}
    </div>
  );
}
