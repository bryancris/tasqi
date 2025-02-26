
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from "date-fns";
import { TimeColumn } from "./TimeColumn";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { getPriorityColor } from "@/utils/taskColors";

interface WeeklyCalendarGridProps {
  currentDate: Date;
  showFullWeek: boolean;
  className?: string;
}

export function WeeklyCalendarGrid({ 
  currentDate,
  showFullWeek,
  className 
}: WeeklyCalendarGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const { tasks } = useTasks();
  const scheduledTasks = tasks.filter(task => task.date && task.start_time);

  return (
    <div className="flex h-full gap-4">
      <div className={cn(
        "flex-1 overflow-hidden border border-gray-200 rounded-lg bg-white shadow-sm",
        "min-w-0",
        className
      )}>
        <div className="flex h-full w-full">
          <TimeColumn timeSlots={timeSlots} />
          <div className="flex flex-1 min-w-0 overflow-x-auto">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 min-w-[120px] relative border-r border-gray-100 last:border-r-0",
                )}
              >
                <div className={cn(
                  "sticky top-0 z-10 bg-[#E5F6FF] border-b border-gray-200 px-4 py-3",
                  isSameDay(day, currentDate) && "bg-[#D3E7FD]"
                )}>
                  <div className={cn(
                    "text-sm font-medium whitespace-nowrap text-gray-700",
                  )}>
                    {format(day, 'EEE d')}
                  </div>
                </div>
                {timeSlots.map((slot, idx) => (
                  <Droppable
                    key={`${day.toISOString()}-${slot.hour}`}
                    droppableId={`${format(day, 'yyyy-MM-dd')}-${slot.hour}`}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "relative border-t border-gray-50 h-[60px] -mt-[1px] first:mt-0 bg-white",
                          idx === timeSlots.length - 1 && "border-b border-gray-100",
                          snapshot.isDraggingOver && "bg-blue-50/30"
                        )}
                      >
                        {/* 30-minute divider line */}
                        <div className="absolute left-0 right-0 top-1/2 border-t border-gray-50/70" />
                        
                        {scheduledTasks
                          .filter(
                            (task) =>
                              task.date &&
                              format(new Date(task.date), "yyyy-MM-dd") ===
                                format(day, "yyyy-MM-dd") &&
                              task.start_time &&
                              parseInt(task.start_time.split(':')[0]) === slot.hour
                          )
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={String(task.id)}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="absolute left-0 right-0 top-0 px-2 py-1.5"
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <div 
                                    className={cn(
                                      "text-sm px-3 py-1.5 rounded-md text-white font-medium",
                                      getPriorityColor(task.priority),
                                      "cursor-pointer truncate hover:brightness-95 transition-all",
                                      snapshot.isDragging && "shadow-lg brightness-95"
                                    )}
                                  >
                                    {task.title}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
