
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../TaskBoard";
import { TaskStatusIcon } from "../TaskStatusIcon";
import { getPriorityColor } from "@/utils/taskColors";
import { cn } from "@/lib/utils";
import { GripVertical, Clock } from "lucide-react";
import { useMemo } from "react";
import { ShareIndicator } from "../task-card/components/ShareIndicator";

interface TaskCardBaseProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void;
  isUpdating?: boolean;
}

export function TaskCardBase({ task, index, isDraggable = false, view = 'daily', onComplete, isUpdating = false }: TaskCardBaseProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isDraggable
  });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  const timeDisplay = getTimeDisplay();
  const isCompleted = task.status === 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 rounded-lg flex items-center justify-between text-white mb-2 min-h-[70px] transition-all",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
          task.status === 'completed' ? 'bg-gray-500' :
          getPriorityColor(task.priority),
        isDragging && "z-50",
        isUpdating && "opacity-70 cursor-wait"
      )}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex items-center gap-4 flex-1">
        {isDraggable && (
          <div className="cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="h-5 w-5 text-white/50 hover:text-white/75 transition-colors" />
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-medium text-base", isCompleted && "line-through opacity-75")}>{task.title}</h3>
            {task.shared && <ShareIndicator />}
          </div>
          {timeDisplay && (
            <div className="flex items-center gap-1 text-sm text-white/90">
              <Clock className="h-3 w-3" />
              <span>{timeDisplay}</span>
            </div>
          )}
        </div>
      </div>
      <div 
        className={cn("ml-2", isUpdating && "opacity-50 pointer-events-none")} 
        onClick={(e) => {
          e.stopPropagation();
          if (!isUpdating && onComplete) {
            onComplete();
          }
        }}
      >
        <TaskStatusIcon 
          status={task.status} 
          className={cn(
            "w-6 h-6 cursor-pointer",
            isUpdating && "animate-pulse"
          )} 
        />
      </div>
    </div>
  );
}
