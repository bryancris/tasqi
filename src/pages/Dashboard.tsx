
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useEffect } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  useTaskNotifications();
  const { view, selectedDate, setSelectedDate } = useCalendarView();

  useEffect(() => {
    console.log('Dashboard mounted, current view:', view);
    console.log('Current pathname:', window.location.pathname);
  }, [view]);

  return (
    <div className="w-full min-h-screen bg-background p-4">
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
