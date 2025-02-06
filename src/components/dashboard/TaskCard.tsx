import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./TaskBoard";
import { WeeklyTaskCard } from "./task-card/WeeklyTaskCard";
import { DailyTaskCard } from "./task-card/DailyTaskCard";
import { MonthlyTaskCard } from "./task-card/MonthlyTaskCard";
import { useState } from "react";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
}

export function TaskCard({ task, index, isDraggable = false, view = 'daily' }: TaskCardProps) {
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
      type: 'task',
      task
    }
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
    scale: isDragging ? 1.05 : undefined,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : undefined,
    cursor: 'grabbing'
  } : undefined;

  const handleClick = () => {
    setIsEditDrawerOpen(true);
  };

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  } : {};

  const renderCard = () => {
    switch (view) {
      case 'weekly':
        return (
          <WeeklyTaskCard
            task={task}
            onClick={handleClick}
            dragHandleProps={dragHandleProps}
          />
        );
      case 'monthly':
        return (
          <MonthlyTaskCard
            task={task}
            onClick={handleClick}
            dragHandleProps={dragHandleProps}
          />
        );
      default:
        return (
          <DailyTaskCard
            task={task}
            onClick={handleClick}
            dragHandleProps={dragHandleProps}
          />
        );
    }
  };

  return (
    <>
      <div className={cn(
        "transition-all duration-200",
        isDragging && "scale-105 shadow-lg"
      )}>
        {renderCard()}
      </div>
      <EditTaskDrawer
        task={task}
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
      />
    </>
  );
}