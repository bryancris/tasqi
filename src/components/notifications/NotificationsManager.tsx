
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
  read: boolean;
  created_at: string;
  reference_id: string | null;
  reference_type: string | null;
  user_id: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'reference_id' | 'reference_type' | 'user_id'>) => void;
  dismissNotification: (id: string) => void;
}

const NotificationsContext = React.createContext<NotificationsContextType>({
  notifications: [],
  showNotification: () => {},
  dismissNotification: () => {},
});

export const useNotifications = () => React.useContext(NotificationsContext);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const showNotification = React.useCallback((notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'reference_id' | 'reference_type' | 'user_id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    setNotifications(prev => [...prev, { 
      ...notification, 
      id,
      read: false,
      created_at: now,
      reference_id: null,
      reference_type: null,
      user_id: '', // This should be set with the actual user ID in a real implementation
    }]);
    void playNotificationSound();
  }, []);

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, showNotification, dismissNotification }}>
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
