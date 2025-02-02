import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
  const { handleDragEnd } = useTaskReorder(tasks);

  // Separate active and completed tasks
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

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

                {/* Completed Tasks Section */}
                {completedTasks.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 mt-8 mb-4">
                      Completed Tasks
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