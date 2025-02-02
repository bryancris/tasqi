import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { TimelineSlot } from "./TimelineSlot";
import { Task } from "./TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { isToday, parseISO } from "date-fns";

interface DesktopTaskViewProps {
  tasks: Task[];
}

export function DesktopTaskView({ tasks }: DesktopTaskViewProps) {
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

  // Separate tasks into categories
  const todayScheduledTasks = tasks.filter(task => 
    task.status === 'scheduled' && 
    task.date && 
    isToday(parseISO(task.date))
  );

  const todayCompletedTasks = tasks.filter(task => {
    if (!task.updated_at) return false;
    return isToday(parseISO(task.updated_at)) && task.status === 'completed';
  });

  const unscheduledTasks = tasks.filter(task => 
    task.status === 'unscheduled'
  );

  // Get all scheduled tasks for the timeline
  const scheduledTasks = tasks.filter(task => 
    task.status === 'scheduled'
  );

  console.log('All tasks:', tasks);
  console.log('Scheduled tasks:', scheduledTasks);

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
                      <h3 className="font-semibold text-sm text-gray-500">Completed Today</h3>
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
                tasks={scheduledTasks} 
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}