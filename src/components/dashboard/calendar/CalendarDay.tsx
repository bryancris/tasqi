import { Task } from "../TaskBoard";
import { format, parseISO } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPriorityColor } from "@/utils/taskColors";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks }: CalendarDayProps) {
  const formatTaskTime = (time: string | undefined) => {
    if (!time) return "";
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div
      className={`min-h-[120px] bg-white p-2 ${
        !isCurrentMonth ? 'text-gray-400' : ''
      } ${isToday ? 'bg-blue-50' : ''}`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${
          isToday ? 'h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center' : ''
        }`}>
          {date.getDate()}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        <TooltipProvider>
          {tasks.slice(0, 3).map((task) => (
            <Tooltip key={task.id}>
              <TooltipTrigger asChild>
                <div
                  className={`px-2 py-1 text-xs rounded truncate cursor-help ${
                    task.priority ? getPriorityColor(task.priority) : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {task.start_time && (
                    <span className="font-medium">
                      {formatTaskTime(task.start_time)}
                    </span>
                  )}
                  <span className="ml-1">{task.title}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[300px]">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                  <div className="text-xs">
                    {task.start_time && task.end_time && (
                      <p>
                        Time: {formatTaskTime(task.start_time)} - {formatTaskTime(task.end_time)}
                      </p>
                    )}
                    {task.priority && (
                      <p className="capitalize">Priority: {task.priority}</p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        {tasks.length > 3 && (
          <div className="text-xs text-gray-500">
            +{tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}