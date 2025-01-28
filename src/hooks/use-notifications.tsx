import { toast } from "@/components/ui/use-toast";

export const useNotifications = () => {
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

      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission === "denied") {
        toast({
          variant: "destructive",
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings to receive alerts"
        });
        return false;
      }

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

  const sendNotification = async (title: string, options?: NotificationOptions) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      if (!('serviceWorker' in navigator)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Service Worker is not supported"
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });

      toast({
        title: "Success",
        description: "Notification sent successfully!"
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send notification"
      });
    }
  };

  return {
    requestPermission: requestNotificationPermission,
    sendNotification
  };
};