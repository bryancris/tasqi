
import { DragEndEvent } from "@dnd-kit/core";
import { Task } from "@/components/dashboard/TaskBoard";

export function useDragEventHandler(tasks: Task[]) {
  // Process drag end event and return updated tasks
  const processDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return null;

    const oldIndex = tasks.findIndex(task => task.id === active.id);
    const newIndex = tasks.findIndex(task => task.id === over.id);

    const updatedTasks = Array.from(tasks);
    const [movedTask] = updatedTasks.splice(oldIndex, 1);
    updatedTasks.splice(newIndex, 0, movedTask);

    return updatedTasks;
  };

  return { processDragEnd };
}
