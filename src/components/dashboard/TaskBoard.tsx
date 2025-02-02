import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { checkAndNotifyUpcomingTasks } from "@/utils/taskNotifications";
import { NotificationTest } from "./notifications/NotificationTest";
import { useNotifications } from "@/hooks/use-notifications";
import { isToday, parseISO } from "date-fns";

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

const fetchTasks = async () => {
  console.log('Fetching tasks...');
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  console.log('Fetched tasks:', data);
  return data as Task[];
};

export function TaskBoard() {
  const isMobile = useIsMobile();
  const { requestPermission } = useNotifications();
  
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Filter tasks for today's scheduled tasks
  const todayScheduledTasks = tasks.filter(task => {
    const isScheduledForToday = task.status === 'scheduled' && 
      task.date && 
      isToday(parseISO(task.date));
    console.log('Task:', task.title, 'date:', task.date, 'isScheduledForToday:', isScheduledForToday);
    return isScheduledForToday;
  });

  // Filter for unscheduled tasks
  const unscheduledTasks = tasks.filter(task => 
    task.status === 'unscheduled'
  );

  // Filter for tasks completed today
  const todayCompletedTasks = tasks.filter(task => {
    if (!task.updated_at) return false;
    return isToday(parseISO(task.updated_at)) && task.status === 'completed';
  });

  // Combine the filtered tasks in the desired order
  const visibleTasks = [
    ...todayScheduledTasks,
    ...todayCompletedTasks,
    ...unscheduledTasks
  ];

  console.log('All tasks:', tasks);
  console.log('Visible tasks:', visibleTasks);

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
        <MobileTaskView tasks={visibleTasks} />
      ) : (
        <DesktopTaskView tasks={visibleTasks} />
      )}
    </div>
  );
}