
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useState, useMemo } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useLocation } from "react-router-dom";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const location = useLocation();

  const view = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  }, [location.pathname]);
  
  const renderView = useMemo(() => {
    switch (view) {
      case 'tasks':
        return (
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            key="taskboard"
          />
        );
      case 'weekly':
        return (
          <WeeklyCalendar 
            initialDate={selectedDate}
            key="weekly"
          />
        );
      case 'calendar':
        return (
          <Calendar 
            initialDate={selectedDate}
            onDateSelect={setSelectedDate}
            key="calendar"
          />
        );
      case 'yearly':
        return (
          <YearlyCalendar 
            onDateSelect={setSelectedDate}
            key="yearly"
          />
        );
      default:
        return null;
    }
  }, [view, selectedDate]);

  return <div className="h-full">{renderView}</div>;
}
