
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";

export function NotificationTest() {
  const { sendNotification } = useNotifications();
  
  const handleTestNotification = async () => {
    try {
      console.log("Testing notification...");
      
      // First check if notifications are supported
      if (!("Notification" in window)) {
        toast.error("This browser does not support notifications");
        return;
      }

      console.log("Current notification permission:", Notification.permission);
      
      // If permission is not granted, request it
      if (Notification.permission !== "granted") {
        console.log("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        console.log("Permission response:", permission);
        if (permission !== "granted") {
          toast.error("Notification permission not granted");
          return;
        }
      }

      // Check service worker
      if (!('serviceWorker' in navigator)) {
        toast.error("Service Worker is not supported in this browser");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker ready, attempting to show notification");

      await registration.showNotification("Test Notification", {
        body: "This is a test notification from TasqiAI",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        vibrate: [200, 100, 200],
        data: {
          url: window.location.origin + '/dashboard'
        },
        tag: 'test-notification',
        renotify: true,
        requireInteraction: true,
        silent: false
      });

      console.log("Notification sent successfully");
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification: " + (error as Error).message);
    }
  };

  return (
    <Button 
      variant="outline"
      onClick={handleTestNotification}
      className="text-sm"
    >
      Test Notification
    </Button>
  );
}
