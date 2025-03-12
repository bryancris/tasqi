
import { useCallback } from 'react';
import { Notification } from '../types';
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { showBrowserNotification } from "@/utils/notifications/notificationUtils";
import { useAuth } from '@/contexts/AuthContext';
import { debugLogNotification } from '@/utils/notifications/debug-utils';

const NOTIFICATION_TIMEOUT = 15000;
const MAX_VISIBLE_NOTIFICATIONS = 4;

export function useNotificationHandlers(
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  timeoutRefs: React.MutableRefObject<Map<string, NodeJS.Timeout>>,
  setOfflineQueue: React.Dispatch<React.SetStateAction<Notification[]>>
) {
  const { session } = useAuth();
  const userId = session?.user?.id;

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
    setNotifications(prev => prev.map(n => n.group === group ? { ...n, read: true } : n));
    
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
    
    // Log the received notification for debugging
    console.log('📩 Creating notification with properties:', {
      ...notification,
      id,
      now,
      userId
    });
    
    // Debug log to trace notification properties
    debugLogNotification({
      ...notification,
      id,
      read: false,
      created_at: now,
      user_id: userId || ''
    }, 'showNotification - before processing');
    
    if (!navigator.onLine) {
      setOfflineQueue(prev => [...prev, {
        ...notification,
        id,
        read: false,
        created_at: now,
        user_id: userId || ''
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
          id: typeof notification.referenceId === 'string' 
              ? parseInt(notification.referenceId) 
              : (notification.referenceId as number) || 0,
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
      
      // Create new notification preserving all original properties
      const newNotification = { 
        ...notification, 
        id,
        read: false,
        created_at: now,
        user_id: userId || '',
        group,
        persistent: isPersistent
      };
      
      // Log the notification being added to state
      console.log('📌 Adding notification to state:', newNotification);
      debugLogNotification(newNotification, 'showNotification - adding to state');
      
      if (prev.length >= MAX_VISIBLE_NOTIFICATIONS) {
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
  }, [dismissNotification, setNotifications, setOfflineQueue, userId]);

  return {
    dismissNotification,
    dismissGroup,
    showNotification
  };
}
