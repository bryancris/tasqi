import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";

export function TaskBoard() {
  const isMobile = useIsMobile();
  
  const tasks = [
    {
      id: 1,
      title: "Do the billing report",
      date: "2024-01-27",
      status: "scheduled",
      time: "09:00 - 10:00",
      color: "bg-emerald-400",
    },
    {
      id: 2,
      title: "Test Unscheduled Tasks",
      date: "2024-01-27",
      status: "unscheduled",
      time: "",
      color: "bg-blue-500",
    },
    {
      id: 3,
      title: "Work on the speeds",
      date: "2024-01-27",
      status: "scheduled",
      time: "18:00 - 19:00",
      color: "bg-red-500",
    },
    {
      id: 4,
      title: "Pick up daughter from school",
      date: "2024-01-27",
      status: "scheduled",
      time: "15:00 - 16:00",
      color: "bg-orange-400",
    },
  ];

  if (isMobile) {
    return <MobileTaskView tasks={tasks} />;
  }

  return <DesktopTaskView tasks={tasks} />;
}