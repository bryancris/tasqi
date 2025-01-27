import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { Sidebar } from "@/components/dashboard/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Calendar />
            <TaskBoard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;