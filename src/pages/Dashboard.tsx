
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

  try {
    if (view === 'weekly') {
      console.log('Rendering WeeklyCalendar');
      return <WeeklyCalendar initialDate={selectedDate} />;
    }

    if (view === 'monthly') {
      console.log('Rendering Calendar (Monthly)');
      return <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />;
    }

    if (view === 'yearly') {
      console.log('Rendering YearlyCalendar');
      return <YearlyCalendar onDateSelect={setSelectedDate} />;
    }

    // Default to TaskBoard
    console.log('Rendering TaskBoard');
    return (
      <TaskBoard 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    );
  } catch (error) {
    console.error('Error rendering Dashboard:', error);
    return (
      <div className="p-4 text-red-500">
        Error loading dashboard. Please try refreshing the page.
      </div>
    );
  }
}
