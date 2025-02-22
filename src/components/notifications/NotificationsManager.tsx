
import * as React from "react";
import { AlertNotification } from "./AlertNotification";
import { playNotificationSound } from "@/utils/notifications/soundUtils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationsContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

const NotificationsContext = React.createContext<NotificationsContextType>({
  showNotification: () => {},
  dismissNotification: () => {},
});

export const useNotifications = () => React.useContext(NotificationsContext);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const showNotification = React.useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    void playNotificationSound();
  }, []);

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ showNotification, dismissNotification }}>
      {children}
      {notifications.map((notification) => (
        <AlertNotification
          key={notification.id}
          open={true}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          action={notification.action}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </NotificationsContext.Provider>
  );
}
