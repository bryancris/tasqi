import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { checkAndNotifyUpcomingTasks } from "@/utils/taskNotifications";
import { NotificationTest } from "./notifications/NotificationTest";
import { useNotifications } from "@/hooks/use-notifications";

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description?: string;
  date: string;
  status: 'scheduled' | 'unscheduled';
  start_time?: string;
  end_time?: string;
  priority?: TaskPriority;
  position: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  reminder_enabled?: boolean;
}

const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;

  return data as Task[];
};

export function TaskBoard() {
  const isMobile = useIsMobile();
  const { requestPermission } = useNotifications();
  
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  useEffect(() => {
    // Initial permission request when component mounts
    requestPermission();

    // Check for tasks every minute
    const interval = setInterval(checkAndNotifyUpcomingTasks, 60000);

    // Initial check
    checkAndNotifyUpcomingTasks();

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div>Error loading tasks</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <NotificationTest />
      </div>
      {isMobile ? (
        <MobileTaskView tasks={tasks} />
      ) : (
        <DesktopTaskView tasks={tasks} />
      )}
    </div>
  );
}