
import { useState, useEffect } from 'react';
import { Notification } from '../types';

const MAX_VISIBLE_NOTIFICATIONS = 4;
const STORAGE_KEY = 'persisted_notifications';

export function useNotificationState() {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }, [notifications]);

  return { notifications, setNotifications };
}
