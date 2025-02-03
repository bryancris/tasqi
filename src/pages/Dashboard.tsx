import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar' | 'yearly' | 'weekly'>('tasks');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  const handleYearlyDateSelect = (date: Date) => {
    setSelectedDate(date);
    setView('calendar');
  };

  const handleDateChange = (date: Date) => {
    console.log('Date changed in Dashboard:', date);
    setSelectedDate(date);
  };

  const renderContent = () => {
    switch (view) {
      case 'tasks':
        return <TaskBoard selectedDate={selectedDate} onDateChange={handleDateChange} />;
      case 'calendar':
        return <Calendar initialDate={selectedDate} />;
      case 'yearly':
        return <YearlyCalendar onDateSelect={handleYearlyDateSelect} />;
      case 'weekly':
        return <WeeklyCalendar initialDate={selectedDate} />;
      default:
        return <TaskBoard selectedDate={selectedDate} onDateChange={handleDateChange} />;
    }
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-gray-50">
        <MobileHeader />
        <main className="pt-[72px] pb-[76px] px-2">
          {renderContent()}
        </main>
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout onViewChange={setView} selectedDate={selectedDate} onDateChange={handleDateChange}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;