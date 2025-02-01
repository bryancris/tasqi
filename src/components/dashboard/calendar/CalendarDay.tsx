import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks }: CalendarDayProps) {
  return (
    <div className={`min-h-[100px] bg-white p-2 relative ${!isCurrentMonth && 'bg-gray-50'}`}>
      <div className={`
        text-sm font-medium 
        ${isToday ? 'h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center' : 'text-gray-900'}
        ${!isCurrentMonth && 'text-gray-400'}
      `}>
        {date.getDate()}
      </div>
      <div className="mt-1 space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`text-xs px-2 py-1 rounded-md text-white ${getPriorityColor(task.priority)}`}
          >
            {task.title}
          </div>
        ))}
      </div>
    </div>
  );
}