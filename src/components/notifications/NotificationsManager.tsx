
import * as React from "react";
import { AlertNotification } from "./AlertNotification";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { showBrowserNotification } from "@/utils/notifications/notificationUtils";
import { useState, useEffect, useCallback } from "react";
import { OfflineNotificationBanner } from "./OfflineNotificationBanner";
import { NotificationGroup } from "./NotificationGroup";

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
  const [notifications, setNotifications] = useState<Notification[]>(() => {
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
  const [offlineQueue, setOfflineQueue] = useState<Notification[]>([]);
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Group notifications by their group ID
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const group = notification.group || 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
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

  const dismissGroup = useCallback((group: string) => {
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

  const showNotification = useCallback(async (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    // Check if we're offline
    if (!navigator.onLine) {
      setOfflineQueue(prev => [...prev, {
        ...notification,
        id,
        read: false,
        created_at: now,
        user_id: ''
      }]);
      return;
    }

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
  }, [dismissNotification]);

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
    <NotificationsContext.Provider value={{ notifications, showNotification, dismissNotification, dismissGroup }}>
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
