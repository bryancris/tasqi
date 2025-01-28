import { Task } from "../TaskBoard";
import { format, startOfDay } from "date-fns";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks }: CalendarDayProps) {
  // Format the calendar day date, ensuring it's at the start of the day
  const calendarDate = startOfDay(date);
  const formattedDate = format(calendarDate, 'yyyy-MM-dd');
  
  // Filter tasks for this specific day, ensuring we compare dates at the start of the day
  const dayTasks = tasks.filter(task => {
    if (!task.date) return false;
    const taskDate = startOfDay(new Date(task.date));
    return format(taskDate, 'yyyy-MM-dd') === formattedDate;
  });

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
        {dayTasks.slice(0, 3).map((task) => (
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
        {dayTasks.length > 3 && (
          <div className="text-xs text-gray-500">
            +{dayTasks.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}