
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export default function Dashboard() {
  useTaskNotifications();
  const { view, selectedDate, setSelectedDate } = useCalendarView();

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="container mx-auto p-4">
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
    </main>
  );
}
