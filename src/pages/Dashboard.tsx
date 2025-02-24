
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { CalendarViewProvider } from "@/contexts/CalendarViewContext";
import { useState, useEffect } from "react";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { Calendar } from "@/components/dashboard/Calendar";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  useTaskNotifications();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleViewChange = (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => {
    const routes = {
      tasks: '/dashboard',
      weekly: '/dashboard/weekly',
      calendar: '/dashboard/monthly',
      yearly: '/dashboard/yearly'
    };
    navigate(routes[view]);
  };

  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/weekly')) return 'weekly';
    if (path.includes('/monthly')) return 'calendar';
    if (path.includes('/yearly')) return 'yearly';
    return 'tasks';
  };

  const renderContent = () => {
    const view = getCurrentView();
    
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
        return null;
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto mt-[72px] mb-[64px]">
          <CalendarViewProvider>
            <Routes>
              <Route path="/" element={renderContent()} />
              <Route path="/weekly" element={renderContent()} />
              <Route path="/monthly" element={renderContent()} />
              <Route path="/yearly" element={renderContent()} />
            </Routes>
          </CalendarViewProvider>
        </main>
        <MobileFooter />
        <UpdatePrompt />
      </div>
    );
  }

  return (
    <CalendarViewProvider>
      <DashboardLayout 
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onViewChange={handleViewChange}
      >
        <div className="h-full">
          <Routes>
            <Route path="/" element={renderContent()} />
            <Route path="/weekly" element={renderContent()} />
            <Route path="/monthly" element={renderContent()} />
            <Route path="/yearly" element={renderContent()} />
          </Routes>
        </div>
        <UpdatePrompt />
      </DashboardLayout>
    </CalendarViewProvider>
  );
}
