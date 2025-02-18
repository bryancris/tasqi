
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useCalendarView } from "@/hooks/use-calendar-view";
import { useState } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";

export default function Dashboard() {
  // Initialize task notifications
  useTaskNotifications();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view, changeView } = useCalendarView();

  const renderView = () => {
    switch (view) {
      case 'tasks':
        return (
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case 'weekly':
        return (
          <WeeklyCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case 'calendar':
        return (
          <Calendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case 'yearly':
        return (
          <YearlyCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      default:
        return (
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
    }
  };

  return (
    <DashboardLayout 
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      onViewChange={changeView}
    >
      <div className="h-full">
        {renderView()}
      </div>
    </DashboardLayout>
  );
}
