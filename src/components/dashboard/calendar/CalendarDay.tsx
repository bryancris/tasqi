
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

  // Add console logging to debug tasks
  console.log(`CalendarDay for ${date.toISOString()}:`, {
    isCurrentMonth,
    isToday,
    tasksCount: tasks.length,
    tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
  });

  return (
    <div 
      onClick={handleDateClick}
      className={`
        min-h-[120px] p-3 bg-white transition-all duration-300
        hover:bg-gray-50 group cursor-pointer
        ${!isCurrentMonth ? 'opacity-40' : ''}
        relative overflow-hidden
      `}
    >
      <div className={`
        text-sm font-medium mb-2 flex items-center justify-center w-8 h-8 rounded-full
        transition-all duration-300 relative z-10
        ${isToday 
          ? 'bg-[#2A9BB5] text-white shadow-md' 
          : 'group-hover:bg-[#2A9BB5]/10'
        }
      `}>
        {dayNumber}
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className={`
              text-xs p-2 rounded-md cursor-pointer
              transition-all duration-200
              transform hover:translate-x-1
              hover:shadow-md
              ${getPriorityColor(task.priority)}
              text-white truncate
            `}
          >
            {task.title}
          </div>
        ))}
      </div>

      {/* Decorative corner gradient */}
      {isCurrentMonth && (
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none
          bg-gradient-to-br from-[#2A9BB5] to-transparent transform -translate-x-1/2 -translate-y-1/2">
        </div>
      )}
    </div>
  );
}

