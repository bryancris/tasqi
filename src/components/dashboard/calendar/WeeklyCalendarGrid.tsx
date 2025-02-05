import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "../TaskBoard";
import { TaskCard } from "../TaskCard";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: Array<{ hour: number; display: string }>;
  scheduledTasks: Task[];
  showFullWeek?: boolean;
}

export function WeeklyCalendarGrid({
  weekDays,
  timeSlots,
  scheduledTasks,
  showFullWeek = true,
}: WeeklyCalendarGridProps) {
  const getTasksForDayAndTime = (day: Date, hour: number) => {
    return scheduledTasks.filter((task) => {
      if (!task.date || !task.start_time) return false;
      const taskDate = new Date(task.date);
      const taskHour = parseInt(task.start_time.split(":")[0]);
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear() &&
        taskHour === hour
      );
    });
  };

  return (
    <div className={cn(
      "grid",
      showFullWeek ? "grid-cols-8" : "grid-cols-6",
      "divide-x divide-gray-200",
      "border border-gray-200 rounded-lg overflow-hidden",
      "bg-white shadow-sm"
    )}>
      {/* Time column header */}
      <div className="h-[100px] bg-[#E3F2F6] flex items-center justify-center relative z-10 border-b border-gray-200">
        <span className="text-gray-600 font-medium">Time</span>
      </div>

      {/* Day column headers */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="h-[100px] bg-[#E3F2F6] p-2 text-center relative z-10 border-b border-gray-200"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {format(day, 'd')}
          </div>
          <div className="text-sm text-gray-500">
            {format(day, 'MMM')}
          </div>
        </div>
      ))}

      {/* Time slots */}
      {timeSlots.map((timeSlot) => (
        <div key={timeSlot.hour} className="contents">
          {/* Time label */}
          <div className="bg-[#E3F2F6] h-[80px] flex items-center justify-center border-t border-gray-200 relative z-10">
            <div className="text-sm text-gray-600 font-medium">
              {timeSlot.hour.toString().padStart(2, '0')}:00
            </div>
          </div>

          {/* Day cells */}
          {weekDays.map((day, dayIndex) => {
            const cellId = `${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`;
            const { setNodeRef, isOver } = useDroppable({
              id: cellId,
              data: {
                type: 'timeSlot',
                date: format(day, 'yyyy-MM-dd'),
                hour: timeSlot.hour,
              },
            });

            const dayTasks = getTasksForDayAndTime(day, timeSlot.hour);

            return (
              <DroppableTimeSlot
                key={cellId}
                ref={setNodeRef}
                isOver={isOver}
                dayIndex={dayIndex}
                dayTasks={dayTasks}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface DroppableTimeSlotProps {
  ref: (element: HTMLDivElement | null) => void;
  isOver: boolean;
  dayIndex: number;
  dayTasks: Task[];
}

function DroppableTimeSlot({
  ref,
  isOver,
  dayIndex,
  dayTasks,
}: DroppableTimeSlotProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "min-h-[80px] relative p-1",
        "transition-colors duration-200",
        "border-t border-gray-200",
        isOver ? "bg-blue-50" : "hover:bg-gray-50",
        dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      )}
    >
      {dayTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}