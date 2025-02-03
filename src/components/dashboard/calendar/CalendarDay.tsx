import { Task } from "../TaskBoard";
import { format } from "date-fns";
import { getPriorityColor } from "@/utils/taskColors";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarDay({ 
  date, 
  isCurrentMonth, 
  isToday,
  tasks,
  onTaskClick,
  onDateClick 
}: CalendarDayProps) {
  const dayNumber = format(date, 'd');
  
  const handleDateClick = () => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div 
      className={`min-h-[100px] p-2 bg-white ${
        !isCurrentMonth ? 'text-gray-400' : ''
      }`}
      onClick={handleDateClick}
    >
      <div className={`
        text-sm font-medium mb-1
        ${isToday ? 'text-blue-600 font-bold' : ''}
      `}>
        {dayNumber}
      </div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className={`
              text-xs p-1 rounded cursor-pointer
              hover:opacity-80 transition-opacity
              ${getPriorityColor(task.priority)}
              text-white truncate
            `}
          >
            {task.title}
          </div>
        ))}
      </div>
    </div>
  );
}