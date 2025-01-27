import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  date: string;
  status: 'scheduled' | 'unscheduled';
  time: string;
  priority?: TaskPriority;
}

export function TaskBoard() {
  const isMobile = useIsMobile();
  
  const tasks: Task[] = [
    {
      id: 1,
      title: "Do the billing report",
      date: "2024-01-27",
      status: "scheduled",
      time: "09:00 - 10:00",
      priority: "low",
    },
    {
      id: 2,
      title: "Test Unscheduled Tasks",
      date: "2024-01-27",
      status: "unscheduled",
      time: "",
    },
    {
      id: 3,
      title: "Work on the speeds",
      date: "2024-01-27",
      status: "scheduled",
      time: "18:00 - 19:00",
      priority: "high",
    },
    {
      id: 4,
      title: "Pick up daughter from school",
      date: "2024-01-27",
      status: "scheduled",
      time: "15:00 - 16:00",
      priority: "medium",
    },
  ];

  if (isMobile) {
    return <MobileTaskView tasks={tasks} />;
  }

  return <DesktopTaskView tasks={tasks} />;
}