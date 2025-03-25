
import { Task } from "./TaskBoard";
import { Card, CardContent } from "@/components/ui/card";
import { startOfDay, isAfter, parseISO, isSameDay } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { TimelineSection } from "./timeline/TimelineSection";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedTaskRefresh } from "@/hooks/use-debounced-task-refresh";
import { isIOSPWA } from "@/utils/platform-detection";
import { MobileTaskBoardHeader } from "./mobile/MobileTaskBoardHeader";
import { MobileTaskList } from "./mobile/MobileTaskList";
import { DragEndEvent } from "@dnd-kit/core";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTodayAtStartOfDay } from "@/utils/dateUtils";

export interface MobileTaskViewProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onComplete?: () => void;
}

export function MobileTaskView({ tasks, selectedDate, onDateChange, onDragEnd, onComplete }: MobileTaskViewProps) {
  const [view, setView] = useState<'board' | 'timeline'>('board');
  const todayStart = getTodayAtStartOfDay(); // Use our utility function for consistent timezone handling
  const queryClient = useQueryClient();
  const { invalidateTasks, cleanup } = useDebouncedTaskRefresh();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isIOSPwaApp = isIOSPWA();
  const isMobile = useIsMobile();
  
  // Log mobile status on mount for debugging
  useEffect(() => {
    console.log("MobileTaskView - isMobile:", isMobile);
  }, [isMobile]);

  useEffect(() => {
    console.log("Setting up mobile view task subscription");
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' || event.type === 'added' || event.type === 'removed') {
        if (Array.isArray(event.query?.queryKey) && 
            event.query?.queryKey[0] === 'tasks') {
          console.log('Task query updated in MobileTaskView, refreshing');
          invalidateTasks(200);
        }
      }
    });

    return () => {
      console.log("Cleaning up mobile view task subscription");
      unsubscribe();
      cleanup();
    };
  }, [queryClient, invalidateTasks, cleanup]);

  // Simplified iOS scroll handler
  useEffect(() => {
    if (isIOSPwaApp && contentRef.current) {
      // Apply iOS-specific fixes
      contentRef.current.style.paddingTop = '0px';
    }
  }, [isIOSPwaApp]);

  const filterTasks = (task: Task) => {
    try {
      if (task.status === 'unscheduled') {
        return true;
      }
      
      if (task.status === 'completed') {
        return shouldShowCompletedTask(task);
      }
      
      if (task.status === 'scheduled' || task.status === 'in_progress' || 
          task.status === 'stuck' || task.status === 'event') {
        if (!task.date) return false;
        return isSameDay(parseISO(task.date), selectedDate);
      }
      
      return false;
    } catch (error) {
      console.error("Error filtering task:", error, task);
      return false;
    }
  };

  const shouldShowCompletedTask = (task: Task) => {
    return task.completed_at && isAfter(new Date(task.completed_at), todayStart);
  };

  const sortedTasks = [...tasks]
    .filter(filterTasks)
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (a.status === 'event' && b.status !== 'event') return -1;
      if (a.status !== 'event' && b.status === 'event') return 1;
      return (a.position || 0) - (b.position || 0);
    });

  const handleComplete = () => {
    console.log("Task completed, refreshing tasks");
    if (onComplete) {
      onComplete();
    }
    invalidateTasks(150);
  };

  // Simplified container style calculation
  const containerStyle = { 
    height: isIOSPwaApp ? '100%' : 'calc(100vh - 144px)',
    paddingTop: 0,
    marginTop: 0
  };

  // If somehow we're not on mobile, this component shouldn't render
  if (!isMobile && process.env.NODE_ENV !== 'development') {
    console.warn('MobileTaskView rendered in non-mobile environment');
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`${isIOSPwaApp ? 'ios-pwa-container' : ''}`}
      style={containerStyle}
    >
      <Card className="h-full border-none shadow-none bg-transparent">
        {/* Apply ios-pwa-fixed-header class to ensure header is visible */}
        <div className={`${isIOSPwaApp ? 'ios-pwa-fixed-header' : ''}`}>
          <MobileTaskBoardHeader 
            view={view} 
            onViewChange={setView} 
          />
        </div>
        <CardContent 
          ref={contentRef}
          className={`overflow-y-auto p-0 pb-8 ${isIOSPwaApp 
            ? 'ios-pwa-content' 
            : 'ios-momentum-scroll h-[calc(100%-5rem)]'}`}
        >
          {view === 'board' ? (
            <MobileTaskList
              tasks={sortedTasks}
              onDragEnd={onDragEnd}
              onComplete={handleComplete}
            />
          ) : (
            <TimelineSection 
              tasks={tasks}
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          )}
          
          {/* Add bottom spacer to prevent content from being hidden behind bottom bar */}
          <div className={`w-full ${isIOSPwaApp ? 'h-[calc(env(safe-area-inset-bottom)+1rem)]' : 'h-8'}`}></div>
        </CardContent>
      </Card>
    </div>
  );
}

