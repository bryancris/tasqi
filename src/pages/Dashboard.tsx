
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
  
  if (!view) {
    return null;
  }

  let content;
  switch (view) {
    case 'tasks':
      content = (
        <TaskBoard 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          key="taskboard"
        />
      );
      break;
    case 'weekly':
      content = (
        <WeeklyCalendar 
          initialDate={selectedDate}
          key="weekly"
        />
      );
      break;
    case 'calendar':
      content = (
        <Calendar 
          initialDate={selectedDate}
          onDateSelect={setSelectedDate}
          key="calendar"
        />
      );
      break;
    case 'yearly':
      content = (
        <YearlyCalendar 
          onDateSelect={setSelectedDate}
          key="yearly"
        />
      );
      break;
    default:
      content = null;
  }

  return <div className="h-full">{content}</div>;
}
