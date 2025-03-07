
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
  
  // Track if we're currently processing a sharing indicator click
  const sharingClickInProgress = useRef(false);

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

  // This function opens the edit drawer when clicking on the main card content
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open edit drawer if sharing click is in progress
    if (sharingClickInProgress.current) {
      return;
    }

    // Check if the click originated from a sharing indicator
    const isSharingIndicator = 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator') ||
        e.target.getAttribute('data-sharing-indicator') === 'true' ||
        e.target.classList.contains('sharing-indicator')
      );
    
    // If it's a sharing indicator click, don't open the drawer
    if (isSharingIndicator) {
      e.stopPropagation();
      return;
    }
    
    // Open the edit drawer for clicks on the main content
    setIsEditDrawerOpen(true);
  };

  // Function to handle sharing indicator clicks
  const handleSharingIndicatorClick = (e: React.MouseEvent) => {
    // Mark that we're handling a sharing indicator click
    sharingClickInProgress.current = true;
    
    // Stop propagation to prevent bubbling to card container
    e.stopPropagation();
    
    // Reset the flag after a short delay
    setTimeout(() => {
      sharingClickInProgress.current = false;
    }, 100);
  };

  // Add event listener to capture sharing indicator clicks at the document level
  useEffect(() => {
    const sharingClickHandler = (e: MouseEvent) => {
      const target = e.target as Element;
      const isSharingIndicator = 
        target.closest('[data-sharing-indicator="true"]') ||
        target.closest('.sharing-indicator') ||
        target.getAttribute?.('data-sharing-indicator') === 'true' ||
        target.classList?.contains('sharing-indicator');
      
      if (isSharingIndicator) {
        // Mark sharing clicks to prevent drawer from opening
        sharingClickInProgress.current = true;
        
        // Reset after a short delay
        setTimeout(() => {
          sharingClickInProgress.current = false;
        }, 100);
      }
    };

    // Capture phase to handle events before they reach the card
    document.addEventListener('mousedown', sharingClickHandler, { capture: true });
    document.addEventListener('click', sharingClickHandler, { capture: true });
    
    return () => {
      document.removeEventListener('mousedown', sharingClickHandler, { capture: true });
      document.removeEventListener('click', sharingClickHandler, { capture: true });
    };
  }, []);

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  } : {};

  // Create a no-parameter onClick handler for card components
  const handleClickWrapper = () => {
    // Empty wrapper function - actual handling is in the parent div
  };

  const renderCard = () => {
    const cardProps = {
      task: localTask,
      onClick: handleClickWrapper,
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
      {/* Main card container with interaction handling */}
      <div 
        ref={cardRef}
        className={cn(
          "transition-all duration-200 transform relative",
          "hover:translate-y-[-2px]",
          isDragging && "opacity-50 scale-105"
        )}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        {/* Apply a capturing click handler to the container for enhanced protection */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          onClickCapture={(e) => {
            if (sharingClickInProgress.current) {
              e.stopPropagation();
            }
          }}
        />
        
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
