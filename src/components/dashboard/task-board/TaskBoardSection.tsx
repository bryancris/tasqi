import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { startOfDay, isAfter } from "date-fns";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
  const { handleDragEnd } = useTaskReorder(tasks);

  // Get today's start for filtering completed tasks
  const todayStart = startOfDay(new Date());

  // Create arrays for active and completed tasks while preserving original order
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);
  
  const activeTasks = sortedTasks.filter(task => task.status !== 'completed');
  const completedTasks = sortedTasks.filter(task => 
    task.status === 'completed' && 
    task.completed_at && 
    isAfter(new Date(task.completed_at), todayStart)
  );

  // Combine tasks in the correct order for drag and drop
  const orderedTasks = [...activeTasks, ...completedTasks];

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
                className="space-y-4"
              >
                {/* Active Tasks */}
                {activeTasks.map((task, index) => (
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

                {/* Completed Tasks Section - Only show if there are completed tasks from today */}
                {completedTasks.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 mt-8 mb-4">
                      Today's Completed Tasks
                    </h3>
                    {completedTasks.map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id.toString()} 
                        index={activeTasks.length + index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard task={task} index={activeTasks.length + index} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </>
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