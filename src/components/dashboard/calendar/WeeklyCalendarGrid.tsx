import { format, isSameDay, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Draggable, Droppable } from "react-beautiful-dnd";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: string[];
  scheduledTasks: Task[];
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks }: WeeklyCalendarGridProps) {
  return (
    <div className="divide-y divide-gray-300 border-b border-gray-300">
      {timeSlots.map((time, timeIndex) => (
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
          
          {weekDays.map((day, dayIndex) => (
            <Droppable
              key={dayIndex}
              droppableId={`${dayIndex}-${timeIndex}`}
              direction="horizontal"
            >
              {(provided) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "p-2 border-r border-gray-300 last:border-r-0 min-h-[80px] relative",
                    "hover:bg-gray-50/80 transition-colors",
                    timeIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  {scheduledTasks
                    .filter(task => 
                      task.date && 
                      isSameDay(parseISO(task.date), day) && 
                      task.start_time && 
                      task.start_time.startsWith(time.split(':')[0])
                    )
                    .map((task, taskIndex) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={taskIndex}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "p-2 rounded-md mb-1 text-sm text-white shadow-sm",
                              getPriorityColor(task.priority)
                            )}
                          >
                            <div className="font-medium">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-xs text-white/90 mt-1">
                                {task.description}
                              </div>
                            )}
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
  );
}