
import * as React from "react";
import { useEffect, useRef } from "react";
import { OfflineNotificationBanner } from "./OfflineNotificationBanner";
import { NotificationGroup } from "./NotificationGroup";
import { NotificationsContext } from "./context/NotificationsContext";
import { useNotificationState } from "./hooks/useNotificationState";
import { useNotificationHandlers } from "./hooks/useNotificationHandlers";
import { Notification } from "./types";

export { useNotifications } from "./context/NotificationsContext";
export type { Notification };

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { notifications, setNotifications } = useNotificationState();
  const [offlineQueue, setOfflineQueue] = React.useState<Notification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const { dismissNotification, dismissGroup, showNotification } = useNotificationHandlers(
    setNotifications,
    timeoutRefs,
    setOfflineQueue
  );

  // Group notifications by their group ID
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const group = notification.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Handle offline/online state changes
  useEffect(() => {
    const handleOnline = async () => {
      // Process queued notifications when we come back online
      for (const notification of offlineQueue) {
        await showNotification(notification);
      }
      setOfflineQueue([]);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineQueue, showNotification]);

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      showNotification, 
      dismissNotification, 
      dismissGroup 
    }}>
      {children}
      <OfflineNotificationBanner />
      {Object.entries(groupedNotifications).map(([groupId, groupNotifications]) => (
        <NotificationGroup
          key={groupId}
          groupId={groupId}
          notifications={groupNotifications}
          onDismissGroup={dismissGroup}
        />
      ))}
    </NotificationsContext.Provider>
  );
}
