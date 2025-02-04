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
      className={cn(
        "pl-0.5 pr-1",
        "relative",
        "transition-colors",
        "border-r border-gray-400 last:border-r-0",
        "hover:bg-gray-50/50",
        "h-[60px] flex-1"
      )}
    >
      {dayTasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
};

export function WeeklyCalendarGrid({ timeSlots, weekDays, scheduledTasks }: WeeklyTimeGridProps) {
  console.log('All scheduled tasks received:', scheduledTasks);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-400">
        {timeSlots.map((timeSlot, timeIndex) => (
          <div 
            key={timeIndex} 
            className="flex h-[60px] border-b border-gray-400 last:border-b-0"
          >
            <div className="border-r border-gray-400 relative bg-[#B2E3EA] w-[80px] flex items-center justify-center shrink-0">
              <div className="text-xs text-gray-600 font-medium">
                {timeSlot.hour.toString().padStart(2, '0')}:00
              </div>
            </div>
            
            <div className="flex flex-1">
              {weekDays.map((day, dayIndex) => (
                <DayCell 
                  key={dayIndex}
                  day={day}
                  timeSlot={timeSlot}
                  tasks={scheduledTasks}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}