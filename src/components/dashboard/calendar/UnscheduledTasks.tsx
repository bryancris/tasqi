
import { Task } from "../TaskBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface UnscheduledTasksProps {
  tasks: Task[];
}

export function UnscheduledTasks({ tasks }: UnscheduledTasksProps) {
  return (
    <Card className="w-80 h-full border-none shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Unscheduled Tasks</CardTitle>
      </CardHeader>
      <Droppable droppableId="unscheduled">
        {(provided, snapshot) => (
          <CardContent 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "space-y-2 min-h-[100px] rounded-md p-2",
              snapshot.isDraggingOver && "bg-[#33C3F0]/10"
            )}
          >
            {tasks.map((task, index) => (
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
                    className={cn(
                      getPriorityColor(undefined), // Use the default blue color for unscheduled tasks
                      "rounded-lg p-2",
                      "shadow-sm hover:brightness-95 transition-colors",
                      snapshot.isDragging && "shadow-md"
                    )}
                  >
                    <p className="text-sm text-white font-medium truncate">
                      {task.title}
                    </p>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}
