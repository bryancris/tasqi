import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { TimelineSlot } from "./TimelineSlot";
import { Task } from "./TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { isToday, parseISO, startOfDay } from "date-fns";

interface DesktopTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
}

export function DesktopTaskView({ tasks, selectedDate }: DesktopTaskViewProps) {
  // For now, hardcode the range. Later this will come from user settings
  const startHour = 9;
  const endHour = 20;

  const timeSlots = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => {
      const hour = startHour + i;
      return hour.toString().padStart(2, '0') + ':00';
    }
  );

  const { handleDragEnd } = useTaskReorder(tasks);

  // Get today's scheduled tasks for the task board
  const todayScheduledTasks = tasks.filter(task => 
    task.status === 'scheduled' && 
    task.date && 
    isToday(parseISO(task.date))
  );

  // Get today's completed tasks
  const todayCompletedTasks = tasks.filter(task => 
    task.status === 'completed' &&
    task.updated_at &&
    isToday(parseISO(task.updated_at))
  );

  // Get unscheduled tasks
  const unscheduledTasks = tasks.filter(task => 
    task.status === 'unscheduled'
  );

  // Get all scheduled tasks for the timeline (not filtered by date)
  const allScheduledTasks = tasks.filter(task => 
    task.status === 'scheduled'
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-6"
                >
                  {/* Today's Scheduled Tasks */}
                  {todayScheduledTasks.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500">Today's Scheduled Tasks</h3>
                      {todayScheduledTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id.toString()} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard task={task} index={index} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}

                  {/* Today's Completed Tasks */}
                  {todayCompletedTasks.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500">Today's Completed Tasks</h3>
                      {todayCompletedTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id.toString()} 
                          index={todayScheduledTasks.length + index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard task={task} index={index} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}

                  {/* Unscheduled Tasks */}
                  {unscheduledTasks.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-gray-500">Unscheduled Tasks</h3>
                      {unscheduledTasks.map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id.toString()} 
                          index={todayScheduledTasks.length + todayCompletedTasks.length + index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskCard task={task} index={index} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSlots.map((timeSlot) => (
              <TimelineSlot 
                key={timeSlot} 
                time={timeSlot} 
                tasks={allScheduledTasks}
                selectedDate={selectedDate}
                onDateChange={() => {}} // We'll implement this later
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}