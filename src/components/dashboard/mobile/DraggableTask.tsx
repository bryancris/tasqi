
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Task } from "../TaskBoard";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { getPriorityColor } from "@/utils/taskColors";

interface DraggableTaskProps {
  task: Task;
}

export const DraggableTask = ({ task }: DraggableTaskProps) => {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: task.id,
    data: {
      task,
      type: 'task'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : undefined
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => {
          setIsEditDrawerOpen(true);
        }}
        className={cn(
          "px-1 py-0.5 rounded-md mb-0.5",
          "text-[10px] leading-tight",
          "text-white break-words",
          "h-full cursor-move",
          task.status === 'unscheduled' ? 'bg-[#1EAEDB]' : getPriorityColor(task.priority),
          task.shared && "ring-1 ring-[#9b87f5]"
        )}
      >
        <div className="font-medium line-clamp-2">{task.title}</div>
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
};
