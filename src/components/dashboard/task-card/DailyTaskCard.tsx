
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Bell } from "lucide-react";

interface DailyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

export function DailyTaskCard({ task, onComplete, onClick, dragHandleProps, extraButton }: DailyTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';

  const getCardColor = () => {
    if (task.status === 'completed') {
      return 'bg-[#8E9196]'; // Dark gray for completed tasks
    }
    if (task.status === 'unscheduled') {
      return 'bg-[#2196F3]';
    }
    return getPriorityColor(task.priority);
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg shadow-sm",
        "hover:shadow-md transition-shadow cursor-pointer",
        getCardColor(),
        task.status === 'completed' ? 'text-white' : '',
        task.shared ? 'ring-2 ring-[#9b87f5]' : 'border border-gray-200'
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={timeString}
        rescheduleCount={task.reschedule_count}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate flex-1",
            task.status === 'completed' ? 'text-white line-through' : 'text-gray-900'
          )}>{task.title}</h3>
          <div className="flex items-center gap-1">
            {task.reminder_enabled && (
              <Bell className={cn(
                "w-4 h-4 shrink-0",
                task.status === 'completed' ? 'text-white/80' : 'text-gray-500'
              )} />
            )}
            {extraButton}
          </div>
        </div>
        {timeString && (
          <p className={cn(
            "text-sm",
            task.status === 'completed' ? 'text-white/80' : 'text-gray-500'
          )}>{timeString}</p>
        )}
      </div>
    </div>
  );
}
