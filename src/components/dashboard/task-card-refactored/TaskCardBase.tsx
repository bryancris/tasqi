
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
import { isIOSPWA, getSharingState } from "@/utils/platform-detection";

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
  
  // Check if running on iOS PWA
  const isIOSPwaApp = isIOSPWA();

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
    
    // Get sharing state from our sharing utils
    const { 
      sharingSheetCloseTime, 
      sharingIndicatorClickTime,
    } = getSharingState();
    
    // Use shorter timeouts to allow interaction sooner
    const sharingClickDelay = isIOSPwaApp ? 1000 : 500;
    const sharingCloseDelay = isIOSPwaApp ? 1500 : 800;
    
    // Check various conditions where we should NOT open the edit drawer
    const recentSharingClick = now - sharingIndicatorClickTime < sharingClickDelay;
    const recentSheetClose = now - sharingSheetCloseTime < sharingCloseDelay;
    
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
      console.log("Handling as sharing indicator click - not opening drawer");
      e.stopPropagation();
      return;
    }
    
    // Don't open if any sharing-related activity is happening
    if (
      sharingClickInProgress.current || 
      recentSharingClick || 
      recentSheetClose
    ) {
      console.log("Blocking card click due to sharing activity:", {
        sharingClickInProgress: sharingClickInProgress.current,
        recentSharingClick,
        recentSheetClose,
        timeSinceSharingClick: now - sharingIndicatorClickTime,
        timeSinceSheetClose: now - sharingSheetCloseTime
      });
      e.stopPropagation();
      return;
    }

    // Check if the event has been marked as handled by sharing indicator
    if ((e as any).__sharingIndicatorHandled) {
      console.log("Blocking card click due to __sharingIndicatorHandled flag");
      e.stopPropagation();
      return;
    }
    
    // If we pass all checks, open the edit drawer
    console.log("Opening edit drawer");
    setIsEditDrawerOpen(true);
  };

  // Function to handle sharing indicator clicks - simplified
  const handleSharingIndicatorClick = (e: React.MouseEvent) => {
    // Mark that we're handling a sharing indicator click
    sharingClickInProgress.current = true;
    
    // Stop propagation to prevent bubbling to card container
    e.stopPropagation();
    
    // Reset the flag after a delay
    setTimeout(() => {
      sharingClickInProgress.current = false;
    }, 1000); // Reduced from 3000ms
  };

  // Add event listener to capture sharing indicator clicks - simplified
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
        
        // For iOS PWA, set protection, but for shorter duration
        if (isIOSPwaApp) {
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
        }
        
        // Reset after a shorter delay
        const timeoutDuration = isIOSPwaApp ? 1000 : 500;
        setTimeout(() => {
          sharingClickInProgress.current = false;
          
          // For iOS PWA, also clear the protection after a delay
          if (isIOSPwaApp) {
            (window as any).__sharingProtectionActive = false;
          }
        }, timeoutDuration);
      }
    };

    // Get clicks in the capture phase before they reach components
    document.addEventListener('mousedown', sharingClickHandler, { capture: true });
    document.addEventListener('click', sharingClickHandler, { capture: true });
    
    // For iOS PWA, also capture touchstart events, but ensure we don't block everything
    if (isIOSPwaApp) {
      const touchStartHandler = (e: TouchEvent) => {
        if (!(e.target instanceof Element)) return;
        
        const target = e.target as Element;
        const isSharingIndicator = 
          target.closest('[data-sharing-indicator="true"]') ||
          target.closest('.sharing-indicator') ||
          target.getAttribute?.('data-sharing-indicator') === 'true' ||
          target.classList?.contains('sharing-indicator');
        
        if (isSharingIndicator) {
          // Mark sharing touches to prevent drawer from opening
          sharingClickInProgress.current = true;
          
          // Set a global flag with timestamp
          (window as any).sharingIndicatorClickTime = Date.now();
          
          // Less aggressive protection for iOS PWA
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
          
          // DON'T prevent default, which was blocking all interactions
          // e.preventDefault();
        }
      };
      
      document.addEventListener('touchstart', touchStartHandler, { 
        capture: true,
        passive: true // Changed from false to true - don't block default behavior
      });
      
      return () => {
        document.removeEventListener('mousedown', sharingClickHandler, { capture: true });
        document.removeEventListener('click', sharingClickHandler, { capture: true });
        document.removeEventListener('touchstart', touchStartHandler, { capture: true });
      };
    }
    
    return () => {
      document.removeEventListener('mousedown', sharingClickHandler, { capture: true });
      document.removeEventListener('click', sharingClickHandler, { capture: true });
    };
  }, [isIOSPwaApp]);

  // Simplified global click handler to avoid blocking legitimate interactions
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if we're in a sharing sheet closing state
      const { 
        isClosingSharingSheet, 
        sharingSheetCloseTime
      } = getSharingState();
      
      // Use shorter timeout for iOS PWA
      const timeoutDuration = isIOSPwaApp ? 1500 : 800;
      const timeSinceClose = Date.now() - sharingSheetCloseTime;
      
      // Only if sheet is closing or closed recently, AND we're clicking on a task card
      // block the interaction
      if ((isClosingSharingSheet || timeSinceClose < timeoutDuration) && 
          e.target instanceof Element) {
        // Only block clicks on task cards
        const isTaskCard = e.target.closest('.task-card') || 
                         e.target.closest('[data-task-card]');
        
        // Don't block clicks on sharing indicators
        const isSharingIndicator = e.target.closest('[data-sharing-indicator="true"]') ||
                                e.target.closest('.sharing-indicator');
        
        if (isTaskCard && !isSharingIndicator) {
          console.log("Blocking click on task card due to recent sharing sheet close");
          e.stopPropagation();
          e.preventDefault();
        }
      }
    };
    
    // Add a document-level click handler with capture
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    // iOS-specific touchstart handler - less aggressive
    if (isIOSPwaApp) {
      const handleTouchStart = (e: TouchEvent) => {
        const { 
          isClosingSharingSheet, 
          sharingSheetCloseTime
        } = getSharingState();
        const timeSinceClose = Date.now() - sharingSheetCloseTime;
        
        // Only block if we're in a protection period and it's a task card touch
        if ((isClosingSharingSheet || timeSinceClose < 1500) && 
            e.target instanceof Element) {
          // Only block touches on task cards
          const isTaskCard = e.target.closest('.task-card') || 
                           e.target.closest('[data-task-card]');
          
          // Don't block touches on sharing indicators
          const isSharingIndicator = e.target.closest('[data-sharing-indicator="true"]') ||
                                  e.target.closest('.sharing-indicator');
          
          if (isTaskCard && !isSharingIndicator) {
            console.log("Blocking touchstart on task card due to sheet close");
            // We still want to prevent default to avoid drawer opening
            e.preventDefault();
            e.stopPropagation();
          }
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart, { 
        capture: true,
        passive: false // Required to use preventDefault
      });
      
      return () => {
        document.removeEventListener('click', handleGlobalClick, { capture: true });
        document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      };
    }
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [isIOSPwaApp]);

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
          isDragging && "opacity-50 scale-105",
          "task-card" // Add a class for easy selection
        )}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        data-task-card="true" // Add data attribute for targeting
      >
        {/* Simplified protection layer */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          data-task-card-protection="true"
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
