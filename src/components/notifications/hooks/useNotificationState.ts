
import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { debugLogNotification } from '@/utils/notifications/debug-utils';

const MAX_VISIBLE_NOTIFICATIONS = 4;
const MAX_AGE_DAYS = 2; // Maximum age for non-persistent notifications
const MAX_PERSISTENT_AGE_DAYS = 7; // Maximum age for persistent notifications

export function useNotificationState() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const STORAGE_KEY = `notifications_${userId || 'anonymous'}`;

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (!userId) return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = new Date();
        
        const recent = parsed.filter((n: Notification) => {
          // Only process notifications for current user
          if (n.user_id !== userId) return false;
          
          const notifDate = new Date(n.created_at);
          const ageInDays = (now.getTime() - notifDate.getTime()) / (24 * 60 * 60 * 1000);
          
          // Keep unread notifications that aren't too old
          if (!n.read) {
            return n.persistent ? 
              ageInDays < MAX_PERSISTENT_AGE_DAYS : 
              ageInDays < MAX_AGE_DAYS;
          }
          
          // Remove read notifications older than 24 hours
          return ageInDays < 1;
        });

        // Debug log the loaded notifications
        if (recent.length > 0) {
          console.log(`📋 Loaded ${recent.length} notifications from storage`);
          debugLogNotification(recent[0], 'useNotificationState - loaded from storage');
        }

        return recent.slice(-MAX_VISIBLE_NOTIFICATIONS);
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
    return [];
  });

  // Clean up old notifications periodically
  useEffect(() => {
    const cleanup = () => {
      if (!userId) return;
      
      setNotifications(current => {
        const now = new Date();
        return current.filter(n => {
          const notifDate = new Date(n.created_at);
          const ageInDays = (now.getTime() - notifDate.getTime()) / (24 * 60 * 60 * 1000);
          
          if (n.read) return ageInDays < 1;
          return n.persistent ? 
            ageInDays < MAX_PERSISTENT_AGE_DAYS : 
            ageInDays < MAX_AGE_DAYS;
        });
      });
    };

    // Run cleanup every hour
    const intervalId = setInterval(cleanup, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [userId]);

  // Persist notifications to localStorage
  useEffect(() => {
    if (!userId) return;
    
    try {
      // Debug log the notifications before saving
      if (notifications.length > 0) {
        console.log(`💾 Saving ${notifications.length} notifications to storage`);
        
        // Check if notifications have all required properties
        notifications.forEach((notification, index) => {
          if (notification.referenceType === 'task') {
            debugLogNotification(notification, `useNotificationState - saving to storage [${index}]`);
          }
        });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  }, [notifications, STORAGE_KEY, userId]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      // Clear stored notifications for anonymous users
      localStorage.removeItem('notifications_anonymous');
    }
  }, [userId]);

  return { notifications, setNotifications };
}
