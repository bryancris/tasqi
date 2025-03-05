
import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../TaskBoard";
import { WeeklyTaskCard } from "../task-card/WeeklyTaskCard";
import { DailyTaskCard } from "../task-card/DailyTaskCard";
import { MonthlyTaskCard } from "../task-card/MonthlyTaskCard";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { cn } from "@/lib/utils";
import { ShareTaskDialog } from "../ShareTaskDialog";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void | Promise<any>;
}

export function TaskCardBase({ task, index, isDraggable = false, view = 'daily', onComplete }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  // Update local task when the prop changes
  useEffect(() => {
    setLocalTask(task);
  }, [task]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

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
    const cardProps = {
      task: localTask,
      onClick: handleClick,
      onComplete,
      dragHandleProps
    };

    switch (view) {
      case 'weekly':
        return <WeeklyTaskCard {...cardProps} />;
      case 'monthly':
        return <MonthlyTaskCard {...cardProps} />;
      default:
        return <DailyTaskCard {...cardProps} />;
    }
  };

  return (
    <>
      <div className={cn(
        "transition-all duration-200 transform",
        "hover:translate-y-[-2px]",
        isDragging && "opacity-50 scale-105"
      )}>
        {renderCard()}
      </div>
      <EditTaskDrawer
        task={localTask}
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
      />
      <ShareTaskDialog
        task={localTask}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
}
