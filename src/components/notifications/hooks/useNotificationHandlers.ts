
import { useCallback } from 'react';
import { Notification } from '../types';
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { showBrowserNotification } from "@/utils/notifications/notificationUtils";

const NOTIFICATION_TIMEOUT = 15000;

export function useNotificationHandlers(
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  timeoutRefs: React.MutableRefObject<Map<string, NodeJS.Timeout>>,
  setOfflineQueue: React.Dispatch<React.SetStateAction<Notification[]>>
) {
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
  }, [setNotifications]);

  const dismissGroup = useCallback((group: string) => {
    setNotifications(prev => {
      return prev.map(n => n.group === group ? { ...n, read: true } : n);
    });
    
    setNotifications(current => {
      current
        .filter(n => n.group === group)
        .forEach(n => {
          if (timeoutRefs.current.has(n.id)) {
            clearTimeout(timeoutRefs.current.get(n.id));
            timeoutRefs.current.delete(n.id);
          }
        });
      return current;
    });
  }, [setNotifications]);

  const showNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
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

    const isPersistent = notification.type === 'error' || 
                        notification.title.toLowerCase().includes('task reminder') ||
                        notification.persistent === true;

    try {
      await playNotificationSound();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }

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
      const newNotification = { 
        ...notification, 
        id,
        read: false,
        created_at: now,
        user_id: '',
        group,
        persistent: isPersistent,
      };
      
      if (prev.length >= 4) {
        const [oldest, ...rest] = prev;
        if (oldest && timeoutRefs.current.has(oldest.id)) {
          clearTimeout(timeoutRefs.current.get(oldest.id));
          timeoutRefs.current.delete(oldest.id);
        }
        return [...rest, newNotification];
      }
      
      return [...prev, newNotification];
    });

    if (!isPersistent) {
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, NOTIFICATION_TIMEOUT);
      timeoutRefs.current.set(id, timeoutId);
    }
  }, [dismissNotification, setNotifications, setOfflineQueue]);

  return {
    dismissNotification,
    dismissGroup,
    showNotification
  };
}
