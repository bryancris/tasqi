
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
  
  // Create a ref to track the last click time
  const lastClickTimeRef = useRef(0);

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
    // Always record the last click time
    const now = Date.now();
    lastClickTimeRef.current = now;
    
    // Get sharing state from window globals (set by ShareIndicator and TaskSharingInfoSheet)
    const sharingClickTime = (window as any).sharingIndicatorClickTime || 0;
    const sharingSheetCloseTime = (window as any).sharingSheetCloseTime || 0;
    const isClosingSheet = (window as any).__isClosingSharingSheet;
    
    // Check various conditions where we should NOT open the edit drawer
    const recentSharingClick = now - sharingClickTime < 1500;
    const recentSheetClose = now - sharingSheetCloseTime < 1500;
    
    // Don't open if any sharing-related activity is happening
    if (sharingClickInProgress.current || recentSharingClick || recentSheetClose || isClosingSheet) {
      console.log("Blocking card click due to sharing interaction");
      e.stopPropagation();
      e.preventDefault();
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
      console.log("Blocking card click due to sharing indicator target");
      e.stopPropagation();
      return;
    }
    
    // Also check if the event has been marked as handled by sharing indicator
    if ((e as any).__sharingIndicatorHandled) {
      console.log("Blocking card click due to __sharingIndicatorHandled flag");
      e.stopPropagation();
      return;
    }
    
    // Only if we pass all checks, open the edit drawer
    console.log("Opening edit drawer");
    setIsEditDrawerOpen(true);
  };

  // Function to handle sharing indicator clicks
  const handleSharingIndicatorClick = (e: React.MouseEvent) => {
    // Mark that we're handling a sharing indicator click
    sharingClickInProgress.current = true;
    
    // Stop propagation to prevent bubbling to card container
    e.stopPropagation();
    
    // Reset the flag after a longer delay
    setTimeout(() => {
      sharingClickInProgress.current = false;
    }, 1000);
  };

  // Add event listener to capture sharing indicator clicks at the document level
  useEffect(() => {
    const sharingClickHandler = (e: MouseEvent) => {
      // Skip if the target isn't an element
      if (!(e.target instanceof Element)) return;
      
      const target = e.target as Element;
      const isSharingIndicator = 
        target.closest('[data-sharing-indicator="true"]') ||
        target.closest('.sharing-indicator') ||
        target.getAttribute?.('data-sharing-indicator') === 'true' ||
        target.classList?.contains('sharing-indicator');
      
      if (isSharingIndicator) {
        // Mark sharing clicks to prevent drawer from opening
        sharingClickInProgress.current = true;
        
        // Set a global flag with timestamp
        (window as any).sharingIndicatorClickTime = Date.now();
        
        // Reset after a longer delay
        setTimeout(() => {
          sharingClickInProgress.current = false;
        }, 1000);
      }
    };

    // Get all click events in the capture phase before they reach components
    document.addEventListener('mousedown', sharingClickHandler, { capture: true });
    document.addEventListener('click', sharingClickHandler, { capture: true });
    
    return () => {
      document.removeEventListener('mousedown', sharingClickHandler, { capture: true });
      document.removeEventListener('click', sharingClickHandler, { capture: true });
    };
  }, []);

  // When sheet closes, prevent task drawer from opening
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if we're in a sharing sheet closing state
      const isClosingSheet = (window as any).__isClosingSharingSheet;
      const sharingSheetCloseTime = (window as any).__sharingSheetCloseTime || 0;
      const timeSinceClose = Date.now() - sharingSheetCloseTime;
      
      // If sheet is closing or closed recently (within 1500ms), block card clicks
      if (isClosingSheet || timeSinceClose < 1500) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    
    // Add a document-level click handler to capture all clicks
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
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
            // Protect against post-sheet-close clicks
            const sharingSheetCloseTime = (window as any).__sharingSheetCloseTime || 0;
            const timeSinceClose = Date.now() - sharingSheetCloseTime;
            
            if (sharingClickInProgress.current || (timeSinceClose < 1500)) {
              console.log("Blocking click via onClickCapture");
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
