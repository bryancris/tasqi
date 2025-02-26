
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { TimeColumn } from "./TimeColumn";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { UnscheduledTasks } from "./UnscheduledTasks";

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

  // Extend time slots to match design (8:00 - 20:00)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const { tasks } = useTasks();
  const scheduledTasks = tasks.filter(task => task.date && task.start_time);
  const unscheduledTasks = tasks.filter(task => !task.date || !task.start_time);

  const handleDragEnd = (result: any) => {
    // Implement drag end logic here
    console.log('Drag ended:', result);
  };

  return (
    <div className="flex h-full gap-4">
      <div className={cn("flex-1 overflow-hidden border rounded-lg bg-white", className)}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="relative flex h-full overflow-x-auto overflow-y-auto scrollbar-hide">
            <TimeColumn timeSlots={timeSlots} />
            <div className="flex flex-1 overflow-x-auto scrollbar-hide">
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="flex-1 min-w-[120px] relative border-r last:border-r-0"
                >
                  <div className="sticky top-0 z-10 bg-white border-b px-3 py-2">
                    <div className="text-sm font-medium text-gray-900">
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
                            "relative border-t h-[60px] -mt-[1px] first:mt-0",
                            idx === timeSlots.length - 1 && "border-b",
                            snapshot.isDraggingOver && "bg-[#E5F6FF]/10"
                          )}
                        >
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
                                    className="absolute left-0 right-0 top-0 p-1"
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1
                                    }}
                                  >
                                    <div 
                                      className={cn(
                                        "text-sm p-1.5 rounded",
                                        "bg-[#E5F6FF] border-[#E5F6FF]",
                                        "hover:bg-[#E5F6FF]/90 transition-colors",
                                        "cursor-pointer truncate",
                                        snapshot.isDragging && "shadow-lg"
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
        </DragDropContext>
      </div>
      <UnscheduledTasks tasks={unscheduledTasks} />
    </div>
  );
}
