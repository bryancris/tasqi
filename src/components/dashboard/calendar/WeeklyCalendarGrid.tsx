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
      "relative",
    )}>
      {/* Time column header */}
      <div className="h-[100px] bg-[#B2E3EA] flex items-center justify-center relative z-10">
        <span className="text-gray-600 font-medium">Time</span>
      </div>

      {/* Day headers */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="h-[100px] bg-[#B2E3EA] p-2 text-center relative z-10"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-lg font-medium">
            {format(day, 'd')}
          </div>
        </div>
      ))}

      {/* Time slots grid */}
      {timeSlots.map((timeSlot) => (
        <div key={timeSlot.hour} className="contents">
          {/* Time label */}
          <div className="bg-[#B2E3EA] h-[60px] flex items-center justify-center border-t border-gray-200 relative z-10">
            <div className="text-xs text-gray-600 font-medium">
              {timeSlot.hour.toString().padStart(2, '0')}:00
            </div>
          </div>

          {/* Day cells for this time slot */}
          {weekDays.map((day) => (
            <DayCell
              key={`${format(day, 'yyyy-MM-dd')}-${timeSlot.hour}`}
              day={day}
              timeSlot={timeSlot}
              tasks={scheduledTasks}
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
    data: {
      task
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    position: 'relative' as const,
    height: '100%',
    width: '100%',
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
          "cursor-move",
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

const DayCell = ({ day, timeSlot, tasks }: { day: Date, timeSlot: TimeSlot, tasks: Task[] }) => {
  // Create a unique ID that includes the full date information
  const cellId = format(day, 'yyyy-MM-dd-HH').replace(/:/g, '-');
  
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
    data: {
      date: format(day, 'yyyy-MM-dd'),
      hour: timeSlot.hour
    }
  });

  const dayTasks = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
    const taskHour = parseInt(task.start_time.split(':')[0]);
    return taskDate === format(day, 'yyyy-MM-dd') && taskHour === timeSlot.hour;
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "min-h-[60px] relative",
        "transition-colors duration-200",
        "border-t border-gray-200",
        isOver ? "bg-gray-100" : "hover:bg-gray-50"
      )}
    >
      {dayTasks.map((task) => (
        <div key={task.id} className="relative h-full w-full p-1">
          <DraggableTask task={task} />
        </div>
      ))}
    </div>
  );
};