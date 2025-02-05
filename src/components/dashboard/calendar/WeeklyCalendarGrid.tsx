import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { format } from "date-fns";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  scheduledTasks: Task[];
  showFullWeek?: boolean;
}

export function WeeklyCalendarGrid({ timeSlots, weekDays, scheduledTasks, showFullWeek = true }: WeeklyTimeGridProps) {
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

      {/* Day headers */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="h-[100px] bg-[#E3F2F6] p-2 text-center relative z-10 border-b border-gray-200"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-lg font-medium text-gray-700 mt-1">
            {format(day, 'd')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {format(day, 'MMM yyyy')}
          </div>
        </div>
      ))}

      {/* Time slots grid */}
      {timeSlots.map((timeSlot) => (
        <div key={timeSlot.hour} className="contents">
          {/* Time label */}
          <div className="bg-[#E3F2F6] h-[80px] flex items-center justify-center border-t border-gray-200 relative z-10">
            <div className="text-sm text-gray-600 font-medium">
              {timeSlot.hour.toString().padStart(2, '0')}:00
            </div>
          </div>

          {/* Day cells for this time slot */}
          {weekDays.map((day, dayIndex) => (
            <DayCell
              key={`${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`}
              day={day}
              timeSlot={timeSlot}
              tasks={scheduledTasks}
              dayIndex={dayIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const DraggableTask = ({ task }: { task: Task }) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  } : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          setIsEditDrawerOpen(true);
        }}
        className={cn(
          "h-full w-full m-1",
          "px-2 py-1 rounded-md",
          "text-[11px] leading-tight",
          "text-white break-words",
          "cursor-move shadow-sm hover:shadow-md transition-shadow",
          getPriorityColor(task.priority)
        )}
      >
        <div className="font-medium line-clamp-3">{task.title}</div>
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
};

const DayCell = ({ day, timeSlot, tasks, dayIndex }: { 
  day: Date, 
  timeSlot: TimeSlot, 
  tasks: Task[],
  dayIndex: number 
}) => {
  // Format the date directly from the day prop without any adjustments
  const formattedDate = format(day, 'yyyy-MM-dd');
  
  const { setNodeRef, isOver } = useDroppable({
    id: `${formattedDate}-${timeSlot.hour}`,
    data: {
      date: formattedDate,
      hour: timeSlot.hour
    }
  });

  // Filter tasks for this specific day and time slot
  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
    const taskHour = parseInt(task.start_time.split(':')[0]);
    return taskDate === formattedDate && taskHour === timeSlot.hour;
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[80px] relative p-1",
        "transition-colors duration-200",
        "border-t border-gray-200",
        isOver ? "bg-blue-50" : "hover:bg-gray-50",
        dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      )}
    >
      {dayTasks.map((task) => (
        <div key={task.id} className="relative h-full w-full">
          <DraggableTask task={task} />
        </div>
      ))}
    </div>
  );
};