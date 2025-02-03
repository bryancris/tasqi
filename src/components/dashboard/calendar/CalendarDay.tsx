import { Task } from "../TaskBoard";

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
  const dayNumber = date.getDate();
  
  const handleDayClick = () => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div 
      onClick={handleDayClick}
      className={`
        min-h-[120px] p-2 bg-white cursor-pointer
        ${!isCurrentMonth && 'text-gray-400'}
        ${isToday && 'bg-blue-50'}
        hover:bg-gray-50 transition-colors
      `}
    >
      <div className="text-sm font-medium mb-1">{dayNumber}</div>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className="text-xs p-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200 transition-colors truncate"
          >
            {task.title}
          </div>
        ))}
      </div>
    </div>
  );
}