import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface DesktopTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  hideTime?: boolean;
}

export function DesktopTaskCard({ task, onComplete, onClick, dragHandleProps, hideTime = false }: DesktopTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200",
        "hover:shadow-md transition-shadow cursor-pointer",
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={timeString}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
        {!hideTime && timeString && (
          <p className="text-sm text-gray-500">{timeString}</p>
        )}
      </div>
    </div>
  );
}