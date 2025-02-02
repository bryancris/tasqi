import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { isToday, parseISO } from "date-fns";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
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

  return (
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
  );
}