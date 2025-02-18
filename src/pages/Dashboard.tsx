
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { useState } from "react";

export default function Dashboard() {
  // Initialize task notifications
  useTaskNotifications();
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <DashboardLayout 
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
    >
      <div className="p-4">
        {/* Dashboard content goes here */}
      </div>
    </DashboardLayout>
  );
}
