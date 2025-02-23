
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useCalendarView } from "@/hooks/use-calendar-view";
import { useState, useEffect, useRef } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view, changeView } = useCalendarView();
  const isMobile = useIsMobile();
  const isInitialRender = useRef(true);

  // Prevent unnecessary re-renders on initial mount
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
  }, []);

  const renderView = () => {
    // Memoize the view components to prevent unnecessary re-renders
    switch (view) {
      case 'tasks':
        return (
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            key="taskboard"
          />
        );
      case 'weekly':
        return (
          <WeeklyCalendar 
            initialDate={selectedDate}
            key="weekly"
          />
        );
      case 'calendar':
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
            key="taskboard-default"
          />
        );
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto mt-[72px] mb-[64px]">
          {renderView()}
        </main>
        <MobileFooter />
        <UpdatePrompt />
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
      <UpdatePrompt />
    </DashboardLayout>
  );
}
