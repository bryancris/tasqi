import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { checkAndNotifyUpcomingTasks } from "@/utils/taskNotifications";
import { Button } from "@/components/ui/button";

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
}

const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;

  return data as Task[];
};

const sendTestNotification = () => {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("Test Notification", {
            body: "This is a test notification from TasqiAI",
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'test-notification',
            data: {
              url: window.location.origin + '/dashboard'
            }
          });
        });
      }
    });
  }
};

export function TaskBoard() {
  const isMobile = useIsMobile();
  
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  useEffect(() => {
    // Request notification permission when component mounts
    if ('Notification' in window) {
      Notification.requestPermission();
    }

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
        <Button 
          variant="outline"
          onClick={sendTestNotification}
          className="text-sm"
        >
          Test Notification
        </Button>
      </div>
      {isMobile ? (
        <MobileTaskView tasks={tasks} />
      ) : (
        <DesktopTaskView tasks={tasks} />
      )}
    </div>
  );
}