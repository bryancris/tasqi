import { Task } from "../TaskBoard";
import { format, parseISO } from "date-fns";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks }: CalendarDayProps) {
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
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 truncate"
          >
            {task.start_time && (
              <span className="font-medium">
                {new Date(`2000-01-01T${task.start_time}`).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            )}
            <span className="ml-1">{task.title}</span>
          </div>
        ))}
        {tasks.length > 3 && (
          <div className="text-xs text-gray-500">
            +{tasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}