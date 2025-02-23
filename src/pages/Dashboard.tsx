
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useState, useEffect, useRef } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { Routes, Route, Navigate } from "react-router-dom";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { view, changeView } = useCalendarView();
  const isMobile = useIsMobile();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
  }, []);

  const renderContent = () => (
    <Routes>
      <Route 
        path="/" 
        element={
          <TaskBoard 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            key="taskboard"
          />
        }
      />
      <Route 
        path="weekly" 
        element={
          <WeeklyCalendar 
            initialDate={selectedDate}
            key="weekly"
          />
        }
      />
      <Route 
        path="calendar" 
        element={
          <Calendar 
            initialDate={selectedDate}
            onDateSelect={setSelectedDate}
            key="calendar"
          />
        }
      />
      <Route 
        path="yearly" 
        element={
          <YearlyCalendar 
            onDateSelect={setSelectedDate}
            key="yearly"
          />
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto mt-[72px] mb-[64px]">
          {renderContent()}
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
        {renderContent()}
      </div>
      <UpdatePrompt />
    </DashboardLayout>
  );
}
