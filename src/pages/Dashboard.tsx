
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

  console.log('Current view:', view); // Debug log

  if (view === 'weekly') {
    return <WeeklyCalendar initialDate={selectedDate} />;
  }

  if (view === 'monthly') {
    return <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />;
  }

  if (view === 'yearly') {
    return <YearlyCalendar onDateSelect={setSelectedDate} />;
  }

  // Default to TaskBoard
  return (
    <TaskBoard 
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  );
}
