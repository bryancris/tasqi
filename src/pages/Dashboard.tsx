
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useTaskNotifications } from "@/hooks/use-task-notifications";

export default function Dashboard() {
  // Initialize task notifications
  useTaskNotifications();

  return (
    <DashboardLayout />
  );
}
