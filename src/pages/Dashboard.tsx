
import { useEffect, useCallback, useRef } from "react";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useLocation } from "react-router-dom";
import { useTasks } from "@/hooks/use-tasks";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { isIOSPWA } from "@/utils/platform-detection";

export default function Dashboard() {
  // Proper hook usage - call at top level unconditionally 
  useTaskNotifications();
  
  const {
    view,
    setView,
    selectedDate,
    setSelectedDate
  } = useCalendarView();
  
  const location = useLocation();
  const { refetch } = useTasks();
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const isIOSPwaApp = isIOSPWA();
  
  // Handle refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log("Refreshing tasks data...");
    try {
      await refetch();
      toast.success("Data refreshed", { 
        duration: 2000,
        position: "top-center"
      });
      return true;
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
      return false;
    }
  }, [refetch]);
  
  // Initialize pull-to-refresh with improved iOS PWA settings
  const {
    containerRef,
    contentRef,
    isRefreshing,
    containerStyle,
    contentStyle,
    refreshIndicatorStyle,
    isIOSPWA: isPWADetected
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    pullDownThreshold: 80,
    refreshIndicatorHeight: 50,
    isPWA: true
  });
  
  // Fix iOS PWA dead space issue after pull-to-refresh
  useEffect(() => {
    if (isIOSPwaApp && contentRef.current) {
      const resetScrollPosition = () => {
        // Reset content position when refresh is done
        if (!isRefreshing && contentRef.current) {
          contentRef.current.scrollTop = 0;
          
          // Reset any potential extra padding
          setTimeout(() => {
            if (contentRef.current) {
              contentRef.current.style.paddingTop = '0px';
            }
          }, 300);
        }
      };
      
      resetScrollPosition();
    }
  }, [isRefreshing, isIOSPwaApp]);
  
  useEffect(() => {
    console.log("Dashboard mounted with isIOSPWA:", isIOSPwaApp, "detected:", isPWADetected);
  }, [isPWADetected, isIOSPwaApp]);
  
  // Update the view based on the current path on mount and when path changes
  useEffect(() => {
    const path = location.pathname;
    console.log("Path changed:", path);
    
    if (path.includes('/week')) {
      setView('weekly');
    } else if (path.includes('/monthly')) {
      setView('monthly');
    } else if (path.includes('/yearly')) {
      setView('yearly');
    } else if (path === '/dashboard' || path.includes('/tasks')) {
      setView('tasks');
    }
  }, [location.pathname, setView]);
  
  // Only log when view changes
  useEffect(() => {
    console.log("Dashboard view changed to:", view);
    console.log("Selected date:", selectedDate);
  }, [view, selectedDate]);
  
  return (
    <div 
      ref={containerRef}
      style={containerStyle}
      className="w-full h-full"
    >
      {/* Refresh indicator */}
      <div style={refreshIndicatorStyle} className="flex items-center justify-center">
        <Spinner className="w-6 h-6 text-primary pull-to-refresh-spinner" />
      </div>
      
      {/* Main content wrapper with scroll fix for iOS */}
      <div
        ref={contentWrapperRef}
        className={`relative w-full h-full ${isIOSPwaApp ? 'ios-pwa-wrapper' : ''}`}
      >
        {/* Main content */}
        <div 
          ref={contentRef}
          style={contentStyle}
          className={`p-4 py-0 px-[10px] h-full overflow-y-auto ios-momentum-scroll ${isIOSPwaApp ? 'ios-pull-to-refresh' : ''}`}
        >
          {view === 'weekly' ? (
            <WeeklyCalendar />
          ) : view === 'monthly' ? (
            <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />
          ) : view === 'yearly' ? (
            <YearlyCalendar onDateSelect={setSelectedDate} />
          ) : (
            <TaskBoard selectedDate={selectedDate} onDateChange={setSelectedDate} />
          )}
          
          {/* This hidden element helps iOS detect the bounce effect */}
          {isIOSPwaApp && <div className="h-px w-full -mb-px"></div>}
          
          {/* Add a spacer div at the bottom to prevent content from being cut off */}
          {isIOSPwaApp && <div className="h-16 w-full"></div>}
        </div>
      </div>
    </div>
  );
}
