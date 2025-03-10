
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

  // Completely revamped card click handler with maximum protection
  const handleCardClick = (e: React.MouseEvent) => {
    // Record current time for timing calculations
    const now = Date.now();
    lastClickTimeRef.current = now;
    
    // Get complete sharing state
    const { 
      isClosingSharingSheet,
      sharingSheetCloseTime, 
      sharingIndicatorClickTime,
      sharingProtectionActive
    } = getSharingState();
    
    // Use longer timeouts for iOS PWA
    const sharingClickDelay = isIOSPwaApp ? 2000 : 1000;
    const sharingCloseDelay = isIOSPwaApp ? 3000 : 1500;
    
    // Check ALL conditions where we should NOT open the edit drawer
    const isSharingSheetClosing = isClosingSharingSheet;
    const recentSharingClick = now - sharingIndicatorClickTime < sharingClickDelay;
    const recentSheetClose = now - sharingSheetCloseTime < sharingCloseDelay;
    const protectionActive = sharingProtectionActive;
    
    console.log("TaskCard click detected", {
      isSharingSheetClosing,
      recentSharingClick,
      recentSheetClose,
      protectionActive,
      timeSinceSharingClick: now - sharingIndicatorClickTime,
      timeSinceSheetClose: now - sharingSheetCloseTime
    });
    
    // Check if the click originated from a sharing indicator - most specific check first
    const isSharingIndicator = 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator') ||
        e.target.getAttribute('data-sharing-indicator') === 'true' ||
        e.target.classList.contains('sharing-indicator')
      );
    
    // If it's a sharing indicator click, don't open the drawer
    if (isSharingIndicator) {
      console.log("Handling as sharing indicator click - blocking drawer open");
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    
    // Don't open drawer if ANY sharing-related activity is happening
    if (
      sharingClickInProgress.current || 
      recentSharingClick || 
      recentSheetClose ||
      isSharingSheetClosing ||
      protectionActive
    ) {
      console.log("BLOCKING card click due to sharing activity", {
        sharingClickInProgress: sharingClickInProgress.current,
        recentSharingClick,
        recentSheetClose,
        isSharingSheetClosing,
        protectionActive
      });
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // Check if the event has been marked as handled by sharing indicator
    if ((e as any).__sharingIndicatorHandled) {
      console.log("Blocking card click due to __sharingIndicatorHandled flag");
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    
    // iOS PWA needs more protection
    if (isIOSPwaApp) {
      // Additional check for iOS PWA - check if this is within several seconds of a sharing sheet close
      const timeSinceSheetClose = now - sharingSheetCloseTime;
      if (timeSinceSheetClose < 3000) {
        console.log("iOS PWA: Blocking card click, too soon after sheet close:", timeSinceSheetClose);
        e.stopPropagation();
        e.preventDefault();
        return;
      }
    }
    
    // Only when all protection checks pass, allow the drawer to open
    console.log("All protection checks passed - opening edit drawer");
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
        
        // For iOS PWA, set protection for much longer duration
        if (isIOSPwaApp) {
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
        }
        
        // Reset after a longer delay for iOS PWA
        const timeoutDuration = isIOSPwaApp ? 2000 : 1000;
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
    
    // For iOS PWA, also capture touchstart events with better handling
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
          
          // Set global protection with maximum durations
          (window as any).sharingIndicatorClickTime = Date.now();
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
          
          // We need to call preventDefault on touchstart for sharing indicator
          // touches to ensure they don't trigger drawer opens
          e.preventDefault();
          e.stopPropagation();
          
          console.log("📱 iOS PWA: Sharing indicator touchstart - maximum protection enabled");
        }
      };
      
      document.addEventListener('touchstart', touchStartHandler, { 
        capture: true,
        passive: false // Allow preventDefault
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

  // Global click handler to block task card interactions during sharing sheet closing
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Get complete sharing state
      const { 
        isClosingSharingSheet, 
        sharingSheetCloseTime,
        sharingProtectionActive
      } = getSharingState();
      
      // Use longer timeout for iOS PWA
      const timeoutDuration = isIOSPwaApp ? 3000 : 1500;
      const timeSinceClose = Date.now() - sharingSheetCloseTime;
      const isWithinCloseTimeout = timeSinceClose < timeoutDuration;
      
      // Check ALL conditions where we should block task card interactions
      if ((isClosingSharingSheet || isWithinCloseTimeout || sharingProtectionActive) && 
          e.target instanceof Element) {
        // Only block clicks on task cards
        const isTaskCard = e.target.closest('.task-card') || 
                         e.target.closest('[data-task-card]');
        
        // Don't block clicks on sharing indicators
        const isSharingIndicator = e.target.closest('[data-sharing-indicator="true"]') ||
                                e.target.closest('.sharing-indicator');
        
        if (isTaskCard && !isSharingIndicator) {
          console.log("BLOCKING click on task card due to protection", {
            isClosingSharingSheet,
            isWithinCloseTimeout,
            sharingProtectionActive,
            timeSinceClose
          });
          e.stopPropagation();
          e.preventDefault();
        }
      }
    };
    
    // Add document-level click handler with capture phase
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    // iOS-specific touchstart handler with more robust logic
    if (isIOSPwaApp) {
      const handleTouchStart = (e: TouchEvent) => {
        const { 
          isClosingSharingSheet, 
          sharingSheetCloseTime,
          sharingProtectionActive
        } = getSharingState();
        
        const timeSinceClose = Date.now() - sharingSheetCloseTime;
        const isWithinCloseTimeout = timeSinceClose < 3000; // Longer for iOS PWA
        
        // Block if ANY protection condition is true
        if ((isClosingSharingSheet || isWithinCloseTimeout || sharingProtectionActive) && 
            e.target instanceof Element) {
          // Only block touches on task cards
          const isTaskCard = e.target.closest('.task-card') || 
                           e.target.closest('[data-task-card]');
          
          // Don't block touches on sharing indicators
          const isSharingIndicator = e.target.closest('[data-sharing-indicator="true"]') ||
                                  e.target.closest('.sharing-indicator');
          
          if (isTaskCard && !isSharingIndicator) {
            console.log("BLOCKING touchstart on task card due to protection", {
              isClosingSharingSheet,
              isWithinCloseTimeout,
              sharingProtectionActive,
              timeSinceClose
            });
            
            // Prevent both default action and propagation
            e.preventDefault();
            e.stopPropagation();
          }
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart, { 
        capture: true,
        passive: false // Allow preventDefault
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
        {/* Add an extra protection layer that makes iOS behavior more consistent */}
        {isIOSPwaApp && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            data-task-card-protection="true"
          />
        )}
        
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
