import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');
  const isMobile = useIsMobile();

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
    <DashboardLayout>
      {view === 'tasks' ? <TaskBoard /> : <Calendar />}
    </DashboardLayout>
  );
}

export default Dashboard;