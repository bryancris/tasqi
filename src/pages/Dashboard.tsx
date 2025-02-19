
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useCalendarView } from "@/hooks/use-calendar-view";
import { useState, useEffect } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view, changeView } = useCalendarView();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Force reflow on mobile status change
    document.body.style.minHeight = '100vh';
    setTimeout(() => {
      document.body.style.minHeight = '';
    }, 0);
  }, [isMobile]);

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
            initialDate={selectedDate}
          />
        );
      case 'calendar':
        return (
          <Calendar 
            initialDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      case 'yearly':
        return (
          <YearlyCalendar 
            onDateSelect={setSelectedDate}
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

  if (window.innerWidth <= 768) {  // Force check actual window width
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto mt-[72px] mb-[64px]">
          {renderView()}
        </main>
        <MobileFooter />
      </div>
    );
  }

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
