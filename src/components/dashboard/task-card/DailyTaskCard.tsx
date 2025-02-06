import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface DailyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
}

export function DailyTaskCard({ task, onComplete, onClick, dragHandleProps }: DailyTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';

  const getCardColor = () => {
    if (task.status === 'unscheduled') {
      return 'bg-[#2196F3]';
    }
    return getPriorityColor(task.priority);
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg shadow-sm border border-gray-200",
        "hover:shadow-md transition-shadow cursor-pointer",
        getCardColor()
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
        {timeString && (
          <p className="text-sm text-gray-500">{timeString}</p>
        )}
      </div>
    </div>
  );
}