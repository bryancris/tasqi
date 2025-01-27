import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="h-screen bg-white">
        <TaskBoard />
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