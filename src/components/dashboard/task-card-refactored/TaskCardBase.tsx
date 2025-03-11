
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
  const touchStartPositionRef = useRef<{x: number, y: number} | null>(null);

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

  // Handle card interactions - don't open drawer if user is dragging
  const handleCardInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't open if we're dragging or completing
    if (isDraggingRef.current || isCompletingRef.current) {
      return;
    }

    // Check if click/touch is on a sharing indicator or complete button or drag handle
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

  // Handle touch start to track potential drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDraggable) return;
    
    // Store touch start position
    const touch = e.touches[0];
    touchStartPositionRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  // Handle touch move to decide if it's a drag
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggable || !touchStartPositionRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPositionRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPositionRef.current.y);
    
    // If moved more than 10px in any direction, consider it a drag attempt
    if (deltaX > 10 || deltaY > 10) {
      isDraggingRef.current = true;
    }
  };

  // Reset touch tracking on touch end
  const handleTouchEnd = () => {
    // Wait a bit before resetting dragging state to allow for click events
    setTimeout(() => {
      isDraggingRef.current = false;
      touchStartPositionRef.current = null;
    }, 50);
  };

  // Handle complete button click with proper type signatures
  const handleComplete = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
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
    // Create wrapper functions without parameters to match expected signatures
    const handleCardClick = () => {
      setIsEditDrawerOpen(true);
    };
    
    const handleTaskComplete = () => {
      handleComplete();
    };

    switch (view) {
      case 'weekly':
        return (
          <WeeklyTaskCard 
            task={localTask}
            dragHandleProps={dragHandleProps}
            onClick={handleCardClick}
            onComplete={handleTaskComplete}
          />
        );
      case 'monthly':
        return (
          <MonthlyTaskCard 
            task={localTask}
            dragHandleProps={dragHandleProps}
            onClick={handleCardClick}
            onComplete={handleTaskComplete}
          />
        );
      default:
        return (
          <DailyTaskCard 
            task={localTask}
            dragHandleProps={dragHandleProps}
            onClick={handleCardClick}
            onComplete={handleTaskComplete}
          />
        );
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
        role="button"
        tabIndex={0}
        data-task-card="true"
        onClick={handleCardInteraction}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
