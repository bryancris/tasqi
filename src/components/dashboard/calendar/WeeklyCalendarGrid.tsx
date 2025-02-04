import { format, isSameDay, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: string[];
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

export function WeeklyTimeGrid({ timeSlots, weekDays, scheduledTasks }: WeeklyTimeGridProps) {
  console.log('All tasks received:', scheduledTasks);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((time, timeIndex) => {
          const hour = parseInt(time);
          return (
            <div 
              key={timeIndex} 
              className={cn(
                "grid",
                weekDays.length === 7 ? "grid-cols-8" : "grid-cols-6",
                "min-h-[80px]"
              )}
            >
              <div className={cn(
                "p-1 border-r border-gray-300 relative",
                "bg-[#B2E3EA]",
                "transition-colors",
                "w-[40px]"
              )}>
                <div className="text-xs text-[#6B7280] whitespace-pre-line text-center">
                  {time}
                </div>
              </div>
              
              {weekDays.map((day, dayIndex) => {
                const { setNodeRef } = useDroppable({
                  id: `${format(day, 'yyyy-MM-dd')}-${hour}`,
                });

                // Filter tasks for this specific day and hour
                const dayTasks = scheduledTasks.filter(task => {
                  if (!task.date || !task.start_time || task.status !== 'scheduled') {
                    return false;
                  }
                  const taskDate = parseISO(task.date);
                  const taskHour = parseInt(task.start_time.split(':')[0]);
                  const isMatch = isSameDay(taskDate, day) && taskHour === hour;
                  
                  console.log('Task filtering:', {
                    taskId: task.id,
                    title: task.title,
                    date: task.date,
                    startTime: task.start_time,
                    status: task.status,
                    matches: isMatch,
                    currentDay: format(day, 'yyyy-MM-dd'),
                    currentHour: hour
                  });
                  
                  return isMatch;
                });

                console.log(`Tasks for ${format(day, 'yyyy-MM-dd')} at ${hour}:00:`, dayTasks);

                return (
                  <div 
                    key={dayIndex}
                    ref={setNodeRef}
                    className={cn(
                      "pl-0.5 pr-1 py-1",
                      "relative",
                      "transition-colors",
                      timeIndex % 2 === 0 ? "bg-[#F8F8FC]" : "bg-white",
                      "border-r border-gray-300 last:border-r-0",
                      "hover:bg-gray-50/50"
                    )}
                  >
                    {dayTasks.map((task) => (
                      <DraggableTask key={task.id} task={task} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Make sure to export the component as a named export
export { WeeklyTimeGrid as WeeklyCalendarGrid };