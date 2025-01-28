import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { TimelineSlot } from "./TimelineSlot";
import { Task } from "./TaskBoard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTaskReorder } from "@/hooks/use-task-reorder";

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

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeSlots.map((timeSlot) => {
              const tasksInSlot = tasks.filter(task => 
                task.start_time === timeSlot && task.status === 'scheduled'
              );
              return (
                <TimelineSlot 
                  key={timeSlot} 
                  time={timeSlot} 
                  tasks={tasksInSlot} 
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}