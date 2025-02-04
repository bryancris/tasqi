import { format, isSameDay, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { EditTaskDrawer } from "../EditTaskDrawer";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: string[];
  scheduledTasks: Task[];
}

function DraggableTask({ task, index }: { task: Task; index: number }) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
      type: 'task'
    }
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
          "p-2 rounded-md mb-1 text-sm text-white shadow-sm cursor-move",
          "hover:brightness-95 transition-all",
          getPriorityColor(task.priority)
        )}
      >
        <div className="font-medium">{task.title}</div>
        {task.description && (
          <div className="text-xs text-white/90 mt-1">
            {task.description}
          </div>
        )}
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks }: WeeklyCalendarGridProps) {
  return (
    <div className="divide-y divide-gray-300 border-b border-gray-300">
      {timeSlots.map((time, timeIndex) => {
        const hour = parseInt(time.split(':')[0]);
        
        return (
          <div 
            key={timeIndex} 
            className={cn(
              "grid",
              weekDays.length === 7 ? "grid-cols-8" : "grid-cols-6",
              "w-full"
            )}
          >
            <div className="p-4 border-r border-gray-300 text-sm font-medium text-gray-600 bg-gray-50">
              {time}
            </div>
            
            {weekDays.map((day, dayIndex) => {
              const { setNodeRef, isOver } = useDroppable({
                id: `${format(day, 'yyyy-MM-dd')}-${hour}`,
                data: {
                  date: day,
                  hour,
                  type: 'calendar-slot'
                }
              });

              const dayTasks = scheduledTasks.filter(task => {
                if (!task.date || !task.start_time) return false;
                const taskDate = parseISO(task.date);
                const taskHour = parseInt(task.start_time.split(':')[0]);
                return isSameDay(taskDate, day) && taskHour === hour;
              });

              return (
                <div 
                  key={dayIndex}
                  ref={setNodeRef}
                  className={cn(
                    "p-2 border-r border-gray-300 last:border-r-0 min-h-[80px] relative",
                    "hover:bg-gray-50/80 transition-colors",
                    timeIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                    isOver && "bg-blue-50"
                  )}
                >
                  {dayTasks.map((task, taskIndex) => (
                    <DraggableTask 
                      key={task.id} 
                      task={task} 
                      index={taskIndex} 
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}