
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useState, useEffect } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view } = useCalendarView();

  useEffect(() => {
    console.log('Dashboard mounted, current view:', view);
    console.log('Current pathname:', window.location.pathname);
  }, [view]);

  return (
    <div className="w-full h-full bg-background min-h-screen">
      {view === 'weekly' ? (
        <WeeklyCalendar initialDate={selectedDate} />
      ) : view === 'monthly' ? (
        <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />
      ) : view === 'yearly' ? (
        <YearlyCalendar onDateSelect={setSelectedDate} />
      ) : (
        <TaskBoard 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}
    </div>
  );
}
