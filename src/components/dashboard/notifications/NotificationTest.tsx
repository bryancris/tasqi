import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NotificationTest() {
  const handleTestNotification = async () => {
    try {
      console.log("Testing notification...");
      
      // First check if notifications are supported
      if (!("Notification" in window)) {
        toast.error("This browser does not support notifications");
        return;
      }

      // Get current permission state
      let permission = Notification.permission;
      console.log("Current notification permission:", permission);
      
      // Handle different permission states
      if (permission === "denied") {
        toast.error(
          "Notifications are blocked. Please enable them in your browser settings:",
          {
            description: "Settings → Privacy & Security → Site Settings → Notifications",
            duration: 5000
          }
        );
        return;
      }
      
      // If permission is not granted, request it
      if (permission !== "granted") {
        try {
          console.log("Requesting notification permission...");
          permission = await Notification.requestPermission();
          console.log("Permission response:", permission);
          
          if (permission !== "granted") {
            toast.error("Notification permission not granted");
            return;
          }
        } catch (error) {
          console.error("Error requesting permission:", error);
          toast.error("Failed to request notification permission");
          return;
        }
      }

      // Check service worker registration
      if (!('serviceWorker' in navigator)) {
        toast.error("Service Worker is not supported in this browser");
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log("Service worker ready state:", registration.active?.state);

      // Always use ServiceWorkerRegistration.showNotification() for consistency across platforms
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

      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      await audio.play();

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