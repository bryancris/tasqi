import { Task } from "./TaskBoard";
import { TaskCard } from "./TaskCard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";

interface MobileTaskViewProps {
  tasks: Task[];
}

export function MobileTaskView({ tasks }: MobileTaskViewProps) {
  const { handleDragEnd } = useTaskReorder(tasks);

  return (
    <div className="p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {tasks.map((task, index) => (
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
                      <TaskCard task={task} isMobile index={index} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}