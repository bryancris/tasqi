
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

  const handleClick = (e: React.MouseEvent) => {
    if (
      (e as any).__sharingIndicatorHandled || 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator') ||
        e.target.getAttribute('data-sharing-indicator') === 'true' ||
        e.target.classList.contains('sharing-indicator')
      ) || 
      (window as any).__sharingIndicatorClicked
    ) {
      console.log('Sharing indicator clicked, blocking task edit drawer');
      return;
    }
    
    setIsEditDrawerOpen(true);
  };

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  } : {};

  // We need to adapt the handleClick function to match the expected signatures
  // by creating a wrapper that doesn't pass the event parameter
  const handleClickWrapper = () => {
    // This is a wrapper function with no parameters to match the expected signature
    // The actual event handling is done by attaching directly to the card container
  };

  const renderCard = () => {
    const cardProps = {
      task: localTask,
      onClick: handleClickWrapper, // Use the wrapper function that takes no parameters
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
      <div 
        className={cn(
          "transition-all duration-200 transform",
          "hover:translate-y-[-2px]",
          isDragging && "opacity-50 scale-105"
        )}
        onClick={handleClick} // Attach the click handler with event parameter here
      >
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
