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
  group?: string; // For grouping similar notifications
}

interface NotificationsContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'reference_id' | 'reference_type' | 'user_id'>) => void;
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
const NOTIFICATION_TIMEOUT = 5000; // 5 seconds
const STORAGE_KEY = 'persisted_notifications';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep notifications that are less than 24 hours old
        const recent = parsed.filter((n: Notification) => {
          const notifDate = new Date(n.created_at);
          const now = new Date();
          const diff = now.getTime() - notifDate.getTime();
          return diff < 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        });
        return recent.slice(-MAX_VISIBLE_NOTIFICATIONS);
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
    return [];
  });

  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Persist notifications to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }, [notifications]);

  const showNotification = React.useCallback((notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'reference_id' | 'reference_type' | 'user_id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    setNotifications(prev => {
      // Check for similar existing notifications to group
      const existingGroup = prev.find(n => 
        n.title === notification.title && 
        n.type === notification.type &&
        !n.read
      )?.group;

      const group = existingGroup || Math.random().toString(36).substr(2, 9);
      
      // If we're at max capacity, remove the oldest notification
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
          reference_id: null,
          reference_type: null,
          user_id: '', // This should be set with the actual user ID in a real implementation
          group,
        }];
      }
      
      return [...prev, { 
        ...notification, 
        id,
        read: false,
        created_at: now,
        reference_id: null,
        reference_type: null,
        user_id: '', // This should be set with the actual user ID in a real implementation
        group,
      }];
    });

    void playNotificationSound();

    // Set auto-dismiss timeout unless it's an error notification
    if (notification.type !== 'error') {
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
      
      // Mark as read instead of removing for persistence
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
    
    // Clear any timeouts for notifications in this group
    notifications
      .filter(n => n.group === group)
      .forEach(n => {
        if (timeoutRefs.current.has(n.id)) {
          clearTimeout(timeoutRefs.current.get(n.id));
          timeoutRefs.current.delete(n.id);
        }
      });
  }, [notifications]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Filter out read notifications for display
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
        />
      ))}
    </NotificationsContext.Provider>
  );
}
