import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationTest() {
  const { sendNotification } = useNotifications();
  
  const handleTestNotification = () => {
    sendNotification("Test Notification", {
      body: "This is a test notification from TasqiAI",
      tag: 'test-notification',
      data: {
        url: window.location.origin + '/dashboard'
      }
    });
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