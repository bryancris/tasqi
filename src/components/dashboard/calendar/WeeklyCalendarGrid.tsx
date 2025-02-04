import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { format, isSameDay, parseISO } from "date-fns";

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
      "grid-rows-[100px_repeat(12,60px)]", // First row 100px for header, then 12 60px rows for time slots
      "w-full h-full"
    )}>
      {/* Render the header component in the first row */}
      <div className="contents">
        {/* Time slots */}
        {timeSlots.map((timeSlot, timeIndex) => (
          <div key={timeSlot.hour} className="contents">
            {/* Time label */}
            <div className="bg-[#B2E3EA] border-r border-gray-200 flex items-center justify-center">
              <div className="text-xs text-gray-600 font-medium">
                {timeSlot.hour.toString().padStart(2, '0')}:00
              </div>
            </div>

            {/* Day cells for this time slot */}
            {weekDays.map((day, dayIndex) => (
              <DayCell
                key={`${dayIndex}-${timeSlot.hour}`}
                day={day}
                timeSlot={timeSlot}
                tasks={scheduledTasks}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const DraggableTask = ({ task }: { task: Task }) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
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
          "px-1 py-0.5",
          "rounded-md mb-0.5",
          "text-[11px] leading-tight",
          "text-white break-words",
          "h-[60px] cursor-move",
          getPriorityColor(task.priority)
        )}
      >
        <div className="font-medium line-clamp-2">{task.title}</div>
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
};

const DayCell = ({ day, timeSlot, tasks }: { day: Date, timeSlot: TimeSlot, tasks: Task[] }) => {
  const { setNodeRef } = useDroppable({
    id: `${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`,
  });

  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    const taskDate = parseISO(task.date);
    const taskHour = parseInt(task.start_time.split(':')[0]);
    return isSameDay(taskDate, day) && taskHour === timeSlot.hour;
  });

  return (
    <div 
      ref={setNodeRef}
      className="border-r border-gray-200 last:border-r-0 border-b p-0.5 hover:bg-gray-50/50"
    >
      {dayTasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
};