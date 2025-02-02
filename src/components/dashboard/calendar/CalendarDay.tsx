import { Task } from "../TaskBoard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks, onTaskClick }: CalendarDayProps) {
  return (
    <div
      className={cn(
        "min-h-[120px] bg-white p-2",
        !isCurrentMonth && "bg-gray-50",
        "flex flex-col gap-1"
      )}
    >
      <span
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
          !isCurrentMonth && "text-gray-400",
          isToday && "bg-primary text-primary-foreground font-semibold"
        )}
      >
        {format(date, "d")}
      </span>
      <div className="flex flex-col gap-1 mt-1">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className={cn(
              "text-left px-2 py-1 rounded text-xs text-white truncate cursor-pointer transition-colors",
              task.status === 'completed' ? 'bg-gray-500' : getPriorityColor(task.priority),
              "hover:opacity-90"
            )}
          >
            {task.title}
          </button>
        ))}
      </div>
    </div>
  );
}