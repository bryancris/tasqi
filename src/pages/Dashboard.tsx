
import { useEffect } from "react";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useLocation } from "react-router-dom";

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
    <div className="w-full h-full p-4 py-0 px-[10px]">
      {view === 'weekly' ? (
        <WeeklyCalendar />
      ) : view === 'monthly' ? (
        <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />
      ) : view === 'yearly' ? (
        <YearlyCalendar onDateSelect={setSelectedDate} />
      ) : (
        <TaskBoard selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}
    </div>
  );
}
