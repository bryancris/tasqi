import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { YearlyCalendar } from "@/components/dashboard/YearlyCalendar";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar' | 'yearly'>('tasks');
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (view) {
      case 'tasks':
        return <TaskBoard />;
      case 'calendar':
        return <Calendar />;
      case 'yearly':
        return <YearlyCalendar />;
      default:
        return <TaskBoard />;
    }
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-white">
        <MobileHeader />
        <div className="pt-[72px] pb-[80px]">
          <TaskBoard />
        </div>
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout onViewChange={setView}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;