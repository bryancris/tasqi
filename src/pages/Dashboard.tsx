
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

  // Render the appropriate component based on the view
  const renderContent = () => {
    switch (view) {
      case 'weekly':
        console.log('Rendering WeeklyCalendar');
        return <WeeklyCalendar initialDate={selectedDate} />;
      
      case 'monthly':
        console.log('Rendering Calendar (Monthly)');
        return <Calendar initialDate={selectedDate} onDateSelect={setSelectedDate} />;
      
      case 'yearly':
        console.log('Rendering YearlyCalendar');
        return <YearlyCalendar onDateSelect={setSelectedDate} />;
      
      default:
        console.log('Rendering TaskBoard');
        return (
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
    }
  };

  // Return the content wrapped in an error boundary
  return (
    <div className="w-full h-full">
      {renderContent()}
    </div>
  );
}
