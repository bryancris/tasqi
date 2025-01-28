import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTaskView } from "./MobileTaskView";
import { DesktopTaskView } from "./DesktopTaskView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { checkAndNotifyUpcomingTasks } from "@/utils/taskNotifications";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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

const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This browser does not support notifications"
      });
      return false;
    }

    // First check if permission is already granted
    if (Notification.permission === "granted") {
      return true;
    }

    // If permission is denied, we can't request it again
    if (Notification.permission === "denied") {
      toast({
        variant: "destructive",
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings to receive alerts"
      });
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You need to allow notifications to receive alerts"
      });
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

const sendTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Service Worker is not supported"
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification("Test Notification", {
      body: "This is a test notification from TasqiAI",
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'test-notification',
      data: {
        url: window.location.origin + '/dashboard'
      }
    });

    toast({
      title: "Success",
      description: "Test notification sent!"
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to send test notification"
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
    // Initial permission request when component mounts
    requestNotificationPermission();

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