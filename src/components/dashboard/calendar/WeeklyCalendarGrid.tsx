import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  scheduledTasks: Task[];
}

function DraggableTask({ task }: { task: Task }) {
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
          "px-1 py-1 rounded-md mb-0.5",
          "text-[11px] leading-tight",
          "text-white break-words",
          "h-full cursor-move",
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
}

// Separate component for day cell to properly handle hooks
function DayCell({ day, timeSlot, tasks }: { day: Date, timeSlot: TimeSlot, tasks: Task[] }) {
  const { setNodeRef } = useDroppable({
    id: `${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`,
  });

  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time || task.status !== 'scheduled') {
      return false;
    }

    const taskDate = startOfDay(parseISO(task.date));
    const currentDay = startOfDay(day);
    const taskHour = parseInt(task.start_time.split(':')[0]);
    const isMatchingDay = isSameDay(taskDate, currentDay);
    const isMatchingTime = taskHour === timeSlot.hour;

    console.log('Task filtering:', {
      taskId: task.id,
      title: task.title,
      taskDate: format(taskDate, 'yyyy-MM-dd'),
      currentDay: format(currentDay, 'yyyy-MM-dd'),
      taskHour,
      timeSlotHour: timeSlot.hour,
      isMatchingDay,
      isMatchingTime,
      matches: isMatchingDay && isMatchingTime
    });

    return isMatchingDay && isMatchingTime;
  });

  console.log(`Tasks for day ${format(day, 'yyyy-MM-dd')}, hour ${timeSlot.hour}:`, dayTasks);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "pl-0.5 pr-1 py-1",
        "relative",
        "transition-colors",
        "border-r border-gray-300 last:border-r-0",
        "hover:bg-gray-50/50"
      )}
    >
      {dayTasks.map((task) => (
        <DraggableTask key={task.id} task={task} />
      ))}
    </div>
  );
}

export function WeeklyCalendarGrid({ timeSlots, weekDays, scheduledTasks }: WeeklyTimeGridProps) {
  console.log('All scheduled tasks received:', scheduledTasks);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((timeSlot, timeIndex) => (
          <div 
            key={timeIndex} 
            className="grid grid-cols-8 min-h-[80px]"
          >
            <div className="p-1 border-r border-gray-300 relative bg-[#B2E3EA] w-[40px]">
              <div className="text-xs text-[#6B7280] whitespace-pre-line text-center">
                {timeSlot.hour}
              </div>
            </div>
            
            {weekDays.map((day, dayIndex) => (
              <DayCell 
                key={dayIndex}
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