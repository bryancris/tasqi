
import * as React from "react";
import { AlertNotification } from "./AlertNotification";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { showBrowserNotification } from "@/utils/notifications/notificationUtils";

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
  reference_id?: string | null;
  reference_type?: string | null;
  user_id: string;
  group?: string;
  persistent?: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>) => void;
  dismissNotification: (id: string) => void;
  dismissGroup: (group: string) => void;
}

const NotificationsContext = React.createContext<NotificationsContextType>({
  notifications: [],
  showNotification: () => {},
  dismissNotification: () => {},
  dismissGroup: () => {},
});

export const useNotifications = () => React.useContext(NotificationsContext);

const MAX_VISIBLE_NOTIFICATIONS = 4;
const NOTIFICATION_TIMEOUT = 15000;
const STORAGE_KEY = 'persisted_notifications';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const recent = parsed.filter((n: Notification) => {
          const notifDate = new Date(n.created_at);
          const now = new Date();
          const diff = now.getTime() - notifDate.getTime();
          return diff < 24 * 60 * 60 * 1000;
        });
        return recent.slice(-MAX_VISIBLE_NOTIFICATIONS);
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
    return [];
  });

  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }, [notifications]);

  const showNotification = React.useCallback(async (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    // Determine if this is a persistent notification
    const isPersistent = notification.type === 'error' || 
                        notification.title.toLowerCase().includes('task reminder') ||
                        notification.persistent === true;

    // Play notification sound
    try {
      await playNotificationSound();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }

    // Show browser notification if window is not focused
    if (!document.hasFocus()) {
      try {
        await showBrowserNotification({
          id: parseInt(notification.reference_id || '0'),
          title: notification.title,
          description: notification.message,
          priority: 'high'
        } as any, 'reminder');
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }

    setNotifications(prev => {
      const existingGroup = prev.find(n => 
        n.title === notification.title && 
        n.type === notification.type &&
        !n.read
      )?.group;

      const group = existingGroup || Math.random().toString(36).substr(2, 9);
      
      if (prev.length >= MAX_VISIBLE_NOTIFICATIONS) {
        const [oldest, ...rest] = prev;
        if (oldest && timeoutRefs.current.has(oldest.id)) {
          clearTimeout(timeoutRefs.current.get(oldest.id));
          timeoutRefs.current.delete(oldest.id);
        }
        return [...rest, { 
          ...notification, 
          id,
          read: false,
          created_at: now,
          user_id: '',
          group,
          persistent: isPersistent,
        }];
      }
      
      return [...prev, { 
        ...notification, 
        id,
        read: false,
        created_at: now,
        user_id: '',
        group,
        persistent: isPersistent,
      }];
    });

    // Set timeout for non-persistent notifications
    if (!isPersistent) {
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, NOTIFICATION_TIMEOUT);
      timeoutRefs.current.set(id, timeoutId);
    }
  }, []);

  const dismissNotification = React.useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (!notification) return prev;
      
      return prev.map(n => n.id === id ? { ...n, read: true } : n);
    });
    
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  const dismissGroup = React.useCallback((group: string) => {
    setNotifications(prev => {
      return prev.map(n => n.group === group ? { ...n, read: true } : n);
    });
    
    notifications
      .filter(n => n.group === group)
      .forEach(n => {
        if (timeoutRefs.current.has(n.id)) {
          clearTimeout(timeoutRefs.current.get(n.id));
          timeoutRefs.current.delete(n.id);
        }
      });
  }, [notifications]);

  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const visibleNotifications = notifications.filter(n => !n.read);

  return (
    <NotificationsContext.Provider value={{ notifications, showNotification, dismissNotification, dismissGroup }}>
      {children}
      {visibleNotifications.map((notification, index) => (
        <AlertNotification
          key={notification.id}
          open={true}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          action={notification.action}
          onDismiss={() => {
            if (notification.group) {
              dismissGroup(notification.group);
            } else {
              dismissNotification(notification.id);
            }
          }}
          index={index}
          referenceId={notification.reference_id ? parseInt(notification.reference_id) : null}
        />
      ))}
    </NotificationsContext.Provider>
  );
}
