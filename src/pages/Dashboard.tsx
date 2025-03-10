
import { useEffect, useCallback } from "react";
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

// Check if running on iOS as PWA
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
const isIOSPWA = isIOS && isStandalone;

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
  
  useEffect(() => {
    console.log("Dashboard mounted with isIOSPWA:", isIOSPWA, "detected:", isPWADetected);
  }, [isPWADetected]);
  
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
      
      {/* Main content */}
      <div 
        ref={contentRef}
        style={contentStyle}
        className={`p-4 py-0 px-[10px] h-full overflow-y-auto ios-momentum-scroll ${isIOSPWA ? 'ios-pull-to-refresh' : ''}`}
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
        {isIOSPWA && <div className="h-px w-full -mb-px"></div>}
      </div>
    </div>
  );
}
