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
  status: 'scheduled' | 'unscheduled' | 'completed';
  start_time?: string;
  end_time?: string;
  priority?: TaskPriority;
  position: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  reminder_enabled?: boolean;
}

interface TaskBoardProps {
  selectedDate: Date;
}

const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data as Task[];
};

export function TaskBoard({ selectedDate }: TaskBoardProps) {
  const isMobile = useIsMobile();
  const { requestPermission } = useNotifications();
  
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  useEffect(() => {
    requestPermission();
    const interval = setInterval(checkAndNotifyUpcomingTasks, 60000);
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
        <DesktopTaskView tasks={tasks} selectedDate={selectedDate} />
      )}
    </div>
  );
}