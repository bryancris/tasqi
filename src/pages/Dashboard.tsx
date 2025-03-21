
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
import { DashboardViewWrapper } from "@/components/dashboard/DashboardViewWrapper";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const isIOSPwaApp = isIOSPWA();
  const isMobile = useIsMobile();
  
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
    contentRef: pullContentRef,
    isRefreshing,
    containerStyle,
    contentStyle,
    refreshIndicatorStyle,
    isIOSPWA: isPWADetected,
    resetPullState
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    pullDownThreshold: 80,
    refreshIndicatorHeight: 50,
    isPWA: true
  });
  
  // Improved iOS PWA handling after pull-to-refresh
  useEffect(() => {
    if (isIOSPwaApp) {
      // Only run cleanup when refresh ends
      if (!isRefreshing && pullContentRef.current) {
        console.log("Cleanup after refresh completed");
        
        // Reset scroll position and padding
        pullContentRef.current.style.paddingTop = '0px';
        
        // Reset pull state after a short delay
        setTimeout(() => {
          resetPullState();
        }, 100);
      }
    }
  }, [isRefreshing, isIOSPwaApp, resetPullState]);
  
  useEffect(() => {
    console.log("Dashboard mounted with isIOSPWA:", isIOSPwaApp, "detected:", isPWADetected);
    console.log("Is mobile:", isMobile);
    
    // Clean up any leftover padding on initial mount for iOS PWA
    if (isIOSPwaApp && pullContentRef.current) {
      console.log("Cleaning up initial padding");
      pullContentRef.current.style.paddingTop = '0px';
    }
  }, [isPWADetected, isIOSPwaApp, isMobile]);
  
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
        style={{ paddingTop: 0, marginTop: 0 }}
      >
        {/* Main content */}
        <div 
          ref={pullContentRef}
          style={{
            ...contentStyle,
            paddingTop: 0,
            marginTop: 0
          }}
          className={`h-full overflow-y-auto ios-momentum-scroll ${isIOSPwaApp ? 'ios-pull-to-refresh' : ''}`}
        >
          <DashboardViewWrapper>
            {view === 'weekly' ? (
              <WeeklyCalendar />
            ) : view === 'monthly' ? (
              <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />
            ) : view === 'yearly' ? (
              <YearlyCalendar onDateSelect={setSelectedDate} />
            ) : (
              <TaskBoard selectedDate={selectedDate} onDateChange={setSelectedDate} />
            )}
          </DashboardViewWrapper>
          
          {/* Helper elements for iOS PWA */}
          {isIOSPwaApp && <div className="h-px w-full -mb-px"></div>}
          {isIOSPwaApp && <div className="h-16 w-full"></div>}
        </div>
      </div>
    </div>
  );
}
