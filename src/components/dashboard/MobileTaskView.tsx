import { Task } from "./TaskBoard";
import { TaskCard } from "./TaskCard";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MobileTaskViewProps {
  tasks: Task[];
}

export function MobileTaskView({ tasks }: MobileTaskViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const updatedTasks = Array.from(tasks);
    const [removed] = updatedTasks.splice(sourceIndex, 1);
    updatedTasks.splice(destinationIndex, 0, removed);

    try {
      const updates = updatedTasks.map((task, index) => {
        const baseUpdate = {
          id: task.id,
          position: index + 1,
          title: task.title,
          status: task.status,
          user_id: task.user_id,
          priority: task.priority,
        };

        // Only include date if it has a value
        if (task.date) {
          return { ...baseUpdate, date: task.date };
        }

        return baseUpdate;
      });

      const { error } = await supabase
        .from('tasks')
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Task reordered",
        description: "Task order has been updated",
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error reordering task:', error);
      toast({
        title: "Error",
        description: "Failed to reorder task. Please try again.",
        variant: "destructive",
      });
    }
  };

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