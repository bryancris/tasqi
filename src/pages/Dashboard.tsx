
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useState } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view } = useCalendarView();
  
  // Default to tasks view if something goes wrong
  const currentView = view || 'tasks';

  let content;
  switch (currentView) {
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
    case 'monthly':
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
      content = (
        <TaskBoard 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          key="taskboard"
        />
      );
  }

  return <div className="h-full">{content}</div>;
}
