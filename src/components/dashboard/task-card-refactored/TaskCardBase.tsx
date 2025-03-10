
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
      isClosingSharingSheet, 
      sharingSheetCloseTime, 
      sharingIndicatorClickTime,
      sharingProtectionActive,
      sharingProtectionStartTime
    } = getSharingState();
    
    // Check various conditions where we should NOT open the edit drawer
    const recentSharingClick = now - sharingIndicatorClickTime < 3000; // Extended time
    
    // On iOS PWA, we use a much longer delay to prevent opening edit drawer after sheet close
    const sharingCloseDelay = isIOSPwaApp ? 3500 : 1500; // Much longer for iOS
    const recentSheetClose = now - sharingSheetCloseTime < sharingCloseDelay;
    
    // Check if sharing protection is active
    const protectionActive = sharingProtectionActive;
    const recentProtection = now - sharingProtectionStartTime < 3500; // Also check time
    
    // Enhanced check for shield element
    const sharingShield = document.querySelector('[data-sharing-shield="true"]');
    
    // Don't open if any sharing-related activity is happening
    if (
      sharingClickInProgress.current || 
      recentSharingClick || 
      recentSheetClose || 
      isClosingSharingSheet ||
      protectionActive ||
      recentProtection ||
      sharingShield
    ) {
      console.log("Blocking card click due to sharing protection:", {
        sharingClickInProgress: sharingClickInProgress.current,
        recentSharingClick,
        recentSheetClose,
        isClosingSharingSheet,
        protectionActive,
        recentProtection,
        sharingShield: !!sharingShield
      });
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
    
    // Extreme check for iOS PWA - check if any sheet closed recently
    if (isIOSPwaApp && (now - sharingSheetCloseTime < 4000)) { // Very long timeout
      console.log("📱 iOS PWA: Blocking card click due to recent sheet close");
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    
    // Additional check for iOS PWA - check if any animated element is currently animating
    if (isIOSPwaApp) {
      const animatingElements = document.querySelectorAll('[data-state="closed"]');
      if (animatingElements.length > 0) {
        console.log("📱 iOS PWA: Blocking card click due to animating elements");
        e.stopPropagation();
        e.preventDefault();
        return;
      }
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
    }, 3000); // Extended from 1000ms
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
        
        // For iOS PWA, set additional protection
        if (isIOSPwaApp) {
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
        }
        
        // Reset after a longer delay for iOS PWA
        const timeoutDuration = isIOSPwaApp ? 3000 : 1000;
        setTimeout(() => {
          sharingClickInProgress.current = false;
          
          // For iOS PWA, also clear the protection after a delay
          if (isIOSPwaApp) {
            setTimeout(() => {
              (window as any).__sharingProtectionActive = false;
            }, 1000); // Extra 1s
          }
        }, timeoutDuration);
      }
    };

    // Get all click events in the capture phase before they reach components
    document.addEventListener('mousedown', sharingClickHandler, { capture: true });
    document.addEventListener('click', sharingClickHandler, { capture: true });
    
    // For iOS PWA, also capture touchstart events
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
          (window as any).__sharingProtectionActive = true;
          (window as any).__sharingProtectionStartTime = Date.now();
          
          // Prevent default
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchstart', touchStartHandler, { 
        capture: true,
        passive: false
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

  // When sheet closes, prevent task drawer from opening
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if we're in a sharing sheet closing state
      const { 
        isClosingSharingSheet, 
        sharingSheetCloseTime,
        sharingProtectionActive 
      } = getSharingState();
      
      // Use longer timeout for iOS PWA
      const timeoutDuration = isIOSPwaApp ? 4000 : 1500; // Much longer for iOS
      const timeSinceClose = Date.now() - sharingSheetCloseTime;
      
      // If sheet is closing or closed recently, block card clicks
      if (isClosingSharingSheet || timeSinceClose < timeoutDuration || sharingProtectionActive) {
        if (e.target instanceof Element) {
          // Don't block clicks on UI controls that are safe
          const isControlElement = e.target.closest('button:not([data-task-card])') || 
                                 e.target.closest('[role="button"]:not([data-task-card])') ||
                                 e.target.closest('input') ||
                                 e.target.closest('a');
                                 
          // But still block any task card clicks
          const isTaskCard = e.target.closest('.task-card') || 
                           e.target.closest('[data-task-card]');
          
          if (!isControlElement || isTaskCard) {
            console.log("Blocking click due to recent sharing sheet close");
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }
    };
    
    // Add a document-level click handler to capture all clicks
    document.addEventListener('click', handleGlobalClick, { capture: true });
    
    // iOS-specific touchstart handler with higher priority
    if (isIOSPwaApp) {
      const handleTouchStart = (e: TouchEvent) => {
        const { 
          isClosingSharingSheet, 
          sharingSheetCloseTime,
          sharingProtectionActive 
        } = getSharingState();
        const timeSinceClose = Date.now() - sharingSheetCloseTime;
        
        // More aggressive blocking for iOS PWA - longer timeouts
        if (isClosingSharingSheet || timeSinceClose < 4000 || sharingProtectionActive) {
          if (e.target instanceof Element) {
            // Only allow touchstart on true UI controls
            const isControlElement = e.target.closest('button:not([data-task-card])') || 
                                   e.target.closest('[role="button"]:not([data-task-card])');
                                   
            // But always block task card touches
            const isTaskCard = e.target.closest('.task-card') || 
                             e.target.closest('[data-task-card]');
                             
            if (!isControlElement || isTaskCard) {
              console.log("Blocking touchstart due to recent sharing sheet close");
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart, { 
        capture: true,
        passive: false // Required to make preventDefault work
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
        {/* Apply a capturing click handler to the container for enhanced protection */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          data-task-card-protection="true"
          onClickCapture={(e) => {
            // Protect against post-sheet-close clicks
            const { 
              sharingSheetCloseTime, 
              isClosingSharingSheet,
              sharingProtectionActive 
            } = getSharingState();
            const timeSinceClose = Date.now() - sharingSheetCloseTime;
            
            // Use platform-specific timeout
            const timeoutDuration = isIOSPwaApp ? 4000 : 1500;
            
            // Check for any protection condition
            if (
              sharingClickInProgress.current || 
              isClosingSharingSheet || 
              (timeSinceClose < timeoutDuration) ||
              sharingProtectionActive
            ) {
              console.log("Blocking click via onClickCapture");
              e.stopPropagation();
              e.preventDefault();
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
