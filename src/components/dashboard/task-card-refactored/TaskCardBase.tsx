
import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../TaskBoard";
import { WeeklyTaskCard } from "../task-card/WeeklyTaskCard";
import { DailyTaskCard } from "../task-card/DailyTaskCard";
import { MonthlyTaskCard } from "../task-card/MonthlyTaskCard";
import { EditTaskDrawer } from "../EditTaskDrawer";
import { cn } from "@/lib/utils";
import { ShareTaskDialog } from "../ShareTaskDialog";
import { isIOSPWA } from "@/utils/platform-detection";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const isIOSPwaApp = isIOSPWA();
  
  // Track touch interactions
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const isCompletingRef = useRef(false);

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

  // Update dragging ref when dragging state changes
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Handle card interactions
  const handleCardInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't open if we're dragging or completing
    if (isDraggingRef.current || isCompletingRef.current) {
      return;
    }

    // Check if click/touch is on a sharing indicator or complete button
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-sharing-indicator="true"]') ||
      target.closest('[data-complete-button="true"]') ||
      target.closest('[data-drag-handle="true"]')
    ) {
      e.stopPropagation();
      return;
    }

    // Open the drawer
    setIsEditDrawerOpen(true);
  };

  // Handle complete button click
  const handleComplete = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isCompletingRef.current = true;

    try {
      if (onComplete) {
        await onComplete();
      }
    } finally {
      // Reset the completing flag after a short delay
      setTimeout(() => {
        isCompletingRef.current = false;
      }, 300);
    }
  };

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
    "data-drag-handle": "true"
  } : {};

  const renderCard = () => {
    const cardProps = {
      task: localTask,
      onComplete: handleComplete,
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
        ref={cardRef}
        className={cn(
          "transition-all duration-200 transform relative",
          "hover:translate-y-[-2px]",
          isDragging && "opacity-50 scale-105",
          "task-card",
          isIOSPwaApp && "ios-pwa-task-card"
        )}
        onClick={handleCardInteraction}
        onTouchEnd={handleCardInteraction}
        role="button"
        tabIndex={0}
        data-task-card="true"
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
