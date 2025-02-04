
import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { isSameDay, parseISO } from "date-fns";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  showFullWeek: boolean;
  tasks: Task[];
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

  console.log('Rendering task:', task.title, 'for time:', task.start_time);

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

export function WeeklyTimeGrid({ timeSlots, weekDays, showFullWeek, tasks }: WeeklyTimeGridProps) {
  console.log('All tasks:', tasks);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((time, timeIndex) => (
          <div 
            key={timeIndex} 
            className={cn(
              "grid",
              showFullWeek ? "grid-cols-8" : "grid-cols-6",
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
                {time.hour}
              </div>
            </div>
            
            {weekDays.map((day, dayIndex) => {
              const { setNodeRef } = useDroppable({
                id: `${dayIndex}-${timeIndex}`,
              });

              const dayTasks = tasks.filter(task => {
                if (!task.date || !task.start_time) return false;
                const taskDate = parseISO(task.date);
                const taskHour = parseInt(task.start_time.split(':')[0]);
                const isMatchingDay = isSameDay(taskDate, day);
                const isMatchingTime = taskHour === time.hour;
                console.log('Task filtering:', {
                  title: task.title,
                  taskDate,
                  day,
                  taskHour,
                  timeHour: time.hour,
                  isMatchingDay,
                  isMatchingTime
                });
                return isMatchingDay && isMatchingTime;
              });

              console.log(`Tasks for day ${dayIndex}, hour ${time.hour}:`, dayTasks);

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
        ))}
      </div>
    </div>
  );
}
