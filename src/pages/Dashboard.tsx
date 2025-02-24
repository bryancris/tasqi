
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

  switch (view) {
    case 'weekly':
      return (
        <WeeklyCalendar 
          initialDate={selectedDate}
          key="weekly"
        />
      );
    case 'monthly':
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
      return (
        <TaskBoard 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          key="taskboard"
        />
      );
  }
}
