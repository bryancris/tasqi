import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState } from "react";

const Dashboard = () => {
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <Sidebar onViewChange={(newView) => setView(newView)} />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {view === 'tasks' ? <TaskBoard /> : <Calendar />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;