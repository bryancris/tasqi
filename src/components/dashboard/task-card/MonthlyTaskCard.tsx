import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface MonthlyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
}

export function MonthlyTaskCard({ task, onComplete, onClick, dragHandleProps }: MonthlyTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';
  
  return (
    <div 
      className={cn(
        "flex items-start gap-2 p-2 bg-white rounded-md shadow-sm border border-gray-200",
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
        <h3 className="font-medium text-gray-900 truncate text-sm">{task.title}</h3>
        {timeString && (
          <p className="text-xs text-gray-500">{timeString}</p>
        )}
      </div>
    </div>
  );
}