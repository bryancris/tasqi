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
import { isIOSPWA, getSharingState, resetProtectionStates } from "@/utils/platform-detection";

// Per-instance timeout handler
const TOUCH_TIMEOUT = 300; // ms

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
  
  // Track touch interactions
  const touchStartTime = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isTouchMoved = useRef(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
  
  // Cleanup any stuck protection states on component mount
  useEffect(() => {
    const sharingState = getSharingState();
    
    // Check if protection states are stuck
    if (sharingState.extremeProtectionActive) {
      const timeSinceProtection = Date.now() - sharingState.extremeProtectionStartTime;
      if (timeSinceProtection > 10000) { // 10 seconds
        console.log("🧹 Cleaning up stuck extreme protection state");
        resetProtectionStates();
      }
    }
    
    return () => {
      // Clear any pending timeouts when component unmounts
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  // Simplified card click handler for mouse events
  const handleCardClick = (e: React.MouseEvent) => {
    console.log("TaskCard mouse click detected");
    
    // Check if the click originated from a sharing indicator
    const isSharingIndicator = 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator')
      );
    
    // If it's a sharing indicator click, don't open the drawer
    if (isSharingIndicator) {
      console.log("Sharing indicator click - blocking drawer open");
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    
    // Check protection state
    const { sharingProtectionActive, extremeProtectionActive } = getSharingState();
    
    // Don't open drawer if protection is active
    if (sharingProtectionActive || extremeProtectionActive) {
      console.log("🚫 Blocking card click due to protection", {
        sharingProtectionActive,
        extremeProtectionActive
      });
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    
    // Otherwise allow the drawer to open
    console.log("✅ Opening edit drawer on mouse click");
    setIsEditDrawerOpen(true);
  };
  
  // Add separate touch handlers for better mobile experience
  const handleTouchStart = (e: React.TouchEvent) => {
    // Record touch start time and position
    touchStartTime.current = Date.now();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isTouchMoved.current = false;
    
    console.log("TaskCard touch start detected");
    
    // Check if the touch is on a sharing indicator
    const isSharingIndicator = 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator')
      );
    
    if (isSharingIndicator) {
      console.log("Touch on sharing indicator - not setting touch timeout");
      return;
    }
    
    // Check protection state
    const { sharingProtectionActive, extremeProtectionActive } = getSharingState();
    
    if (sharingProtectionActive || extremeProtectionActive) {
      console.log("🚫 Not setting touch timeout due to protection", {
        sharingProtectionActive,
        extremeProtectionActive
      });
      return;
    }
    
    // Set timeout to open drawer after TOUCH_TIMEOUT ms if the touch doesn't move
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    touchTimeoutRef.current = setTimeout(() => {
      // Only proceed if touch hasn't moved significantly
      if (!isTouchMoved.current) {
        console.log("✅ Opening edit drawer after touch timeout");
        setIsEditDrawerOpen(true);
      }
    }, TOUCH_TIMEOUT);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Calculate how far the touch has moved
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // If moved more than 10px in any direction, consider it a move not a tap
    if (deltaX > 10 || deltaY > 10) {
      isTouchMoved.current = true;
      
      // Clear the timeout to prevent drawer from opening
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear any pending timeouts
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    // Check if this was a quick tap without much movement
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Check if the touch is on a sharing indicator
    const isSharingIndicator = 
      e.target instanceof Element && (
        e.target.closest('[data-sharing-indicator="true"]') ||
        e.target.closest('.sharing-indicator')
      );
    
    if (isSharingIndicator) {
      console.log("Touch end on sharing indicator - not opening drawer");
      return;
    }
    
    // Check protection state
    const { sharingProtectionActive, extremeProtectionActive } = getSharingState();
    
    if (sharingProtectionActive || extremeProtectionActive) {
      console.log("🚫 Blocking touch end due to protection", {
        sharingProtectionActive,
        extremeProtectionActive
      });
      return;
    }
    
    // If it was a quick tap without movement, open the drawer immediately
    if (touchDuration < TOUCH_TIMEOUT && !isTouchMoved.current) {
      console.log("✅ Quick tap detected - opening edit drawer");
      setIsEditDrawerOpen(true);
    }
  };

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
      {/* Main card container with enhanced touch handling */}
      <div 
        ref={cardRef}
        className={cn(
          "transition-all duration-200 transform relative",
          "hover:translate-y-[-2px]",
          isDragging && "opacity-50 scale-105",
          "task-card", // Add a class for easy selection
          isIOSPwaApp && "ios-pwa-task-card" // Special class for iOS PWA
        )}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        data-task-card="true" // Add data attribute for targeting
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
