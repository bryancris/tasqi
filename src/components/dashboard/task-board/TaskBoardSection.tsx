import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "../TaskCard";
import { Task } from "../TaskBoard";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";
import { startOfDay, isAfter } from "date-fns";
import { useState } from "react";

interface TaskBoardSectionProps {
  tasks: Task[];
}

export function TaskBoardSection({ tasks }: TaskBoardSectionProps) {
  const { handleDragEnd } = useTaskReorder(tasks);
  const todayStart = startOfDay(new Date());
  const [localTasks, setLocalTasks] = useState(tasks);

  // Function to check if a completed task should be shown
  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  // Filter tasks for display
  const displayTasks = localTasks.filter(task => 
    task.status !== 'completed' || shouldShowCompletedTask(task)
  ).sort((a, b) => a.position - b.position);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    // Update local state immediately
    setLocalTasks(updatedItems);

    // Call the backend update
    await handleDragEnd(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {displayTasks.map((task, index) => (
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}