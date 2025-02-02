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
  const todayStart = startOfDay(new Date());

  // Sort tasks by position while maintaining the original array
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  // Function to check if a completed task should be shown
  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  // Check if we have any completed tasks from today to show the section
  const hasCompletedTasksToday = sortedTasks.some(
    task => task.status === 'completed' && shouldShowCompletedTask(task)
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
                className="space-y-4"
              >
                {/* Active Tasks */}
                {sortedTasks.map((task, index) => (
                  task.status !== 'completed' && (
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
                  )
                ))}

                {/* Completed Tasks Section - Only show if there are completed tasks from today */}
                {hasCompletedTasksToday && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-700 mt-8 mb-4">
                      Today's Completed Tasks
                    </h3>
                    {sortedTasks.map((task, index) => (
                      task.status === 'completed' && 
                      shouldShowCompletedTask(task) && (
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
                      )
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