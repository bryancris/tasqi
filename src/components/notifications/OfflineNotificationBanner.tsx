
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

export function OfflineNotificationBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasQueuedNotifications, setHasQueuedNotifications] = useState(false);

  useEffect(() => {
    const checkQueuedNotifications = () => {
      const queue = localStorage.getItem('notificationQueue');
      setHasQueuedNotifications(!!queue && JSON.parse(queue).length > 0);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', checkQueuedNotifications);

    checkQueuedNotifications();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', checkQueuedNotifications);
    };
  }, []);

  if (!isOffline && !hasQueuedNotifications) return null;

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto max-w-md">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {isOffline ? (
          "You're offline. Notifications will be delivered when you're back online."
        ) : (
          hasQueuedNotifications && "Delivering queued notifications..."
        )}
      </AlertDescription>
    </Alert>
  );
}
