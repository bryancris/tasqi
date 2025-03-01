
import { useEffect } from "react";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export default function Dashboard() {
  useTaskNotifications();
  const {
    view,
    selectedDate,
    setSelectedDate
  } = useCalendarView();
  
  // Only log on first mount, not on every render
  useEffect(() => {
    console.log("Dashboard mounted, view:", view);
    console.log("Selected date:", selectedDate);
  }, []); // Empty dependency array to only run once
  
  return <div className="w-full h-full p-4 py-0 px-[10px]">
      {view === 'weekly' ? <WeeklyCalendar /> : view === 'monthly' ? <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} /> : view === 'yearly' ? <YearlyCalendar onDateSelect={setSelectedDate} /> : <TaskBoard selectedDate={selectedDate} onDateChange={setSelectedDate} />}
    </div>;
}
