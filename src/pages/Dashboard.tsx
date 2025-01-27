import { Calendar } from "@/components/dashboard/Calendar";
import { TaskBoard } from "@/components/dashboard/TaskBoard";
import { Sidebar } from "@/components/dashboard/Sidebar";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          <TaskBoard />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;