
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationQueue {
  id: string;
  notification: NotificationData;
  timestamp: number;
  retries: number;
}

interface NotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  priority?: 'high' | 'normal' | 'low';
  groupId?: string;
  data?: Record<string, any>;
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private periodicSyncInterval = 15; // minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private notificationQueue: NotificationQueue[] = [];

  async initialize(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }

      // Register service worker with immediate control
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Take control immediately
      if (this.swRegistration.active) {
        this.swRegistration.active.postMessage({ type: 'TAKE_CONTROL' });
      }

      // Load queued notifications from storage
      await this.loadQueuedNotifications();

      // Enable background sync
      if ('sync' in (this.swRegistration as any)) {
        await this.setupBackgroundSync();
      }

      // Enable periodic sync
      if ('periodicSync' in this.swRegistration) {
        await this.setupPeriodicSync();
      }

      // Start processing queued notifications
      this.processNotificationQueue();

      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribe(): Promise<NotificationSubscription | null> {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker not registered');
      }

      const permission = await this.requestPermission();
      if (!permission) {
        toast.error('Notification permission denied');
        return null;
      }

      // Get existing subscription or create new one
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        const response = await fetch('/api/notifications/vapid-public-key');
        const vapidPublicKey = await response.text();
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      // Schedule subscription renewal
      this.scheduleSubscriptionRenewal(subscription);

      const p256dhKey = this.arrayBufferToBase64(subscription.getKey('p256dh'));
      const authKey = this.arrayBufferToBase64(subscription.getKey('auth'));

      // Store subscription in Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        auth_keys: {
          p256dh: p256dhKey,
          auth: authKey
        },
        user_id: (await supabase.auth.getUser()).data.user?.id,
        platform: 'web',
        device_type: 'web',
        active: true,
        last_updated: new Date().toISOString()
      });

      if (error) throw error;

      console.log('✅ Push subscription saved successfully');

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey,
          auth: authKey
        }
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable notifications');
      return null;
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    try {
      if ('sync' in (this.swRegistration as any)) {
        await (this.swRegistration as any).sync.register('notification-sync');
        console.log('✅ Background sync registered');
      }
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
    }
  }

  private async setupPeriodicSync(): Promise<void> {
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      });

      if (status.state === 'granted') {
        await (this.swRegistration as any).periodicSync.register('check-notifications', {
          minInterval: this.periodicSyncInterval * 60 * 1000
        });
        console.log('✅ Periodic sync registered');
      }
    } catch (error) {
      console.error('❌ Periodic sync registration failed:', error);
    }
  }

  private scheduleSubscriptionRenewal(subscription: PushSubscription): void {
    // Check expiration time if available
    const expirationTime = subscription.expirationTime;
    if (expirationTime) {
      const timeUntilRenewal = expirationTime - Date.now() - (24 * 60 * 60 * 1000); // Renew 1 day before expiration
      setTimeout(() => this.renewSubscription(), timeUntilRenewal);
    } else {
      // If no expiration time, check weekly
      setInterval(() => this.renewSubscription(), 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async renewSubscription(): Promise<void> {
    console.log('🔄 Renewing push subscription...');
    await this.subscribe();
  }

  private async loadQueuedNotifications(): Promise<void> {
    try {
      const queuedNotifications = localStorage.getItem('notificationQueue');
      if (queuedNotifications) {
        this.notificationQueue = JSON.parse(queuedNotifications);
        console.log('✅ Loaded queued notifications:', this.notificationQueue.length);
      }
    } catch (error) {
      console.error('❌ Error loading queued notifications:', error);
    }
  }

  private async processNotificationQueue(): Promise<void> {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue[0];
      
      try {
        await this.showNotification(notification.notification);
        this.notificationQueue.shift(); // Remove processed notification
        this.saveNotificationQueue();
      } catch (error) {
        console.error('❌ Error processing notification:', error);
        
        if (notification.retries < this.MAX_RETRIES) {
          notification.retries++;
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        } else {
          this.notificationQueue.shift(); // Remove failed notification
          this.saveNotificationQueue();
        }
      }
    }
  }

  private saveNotificationQueue(): void {
    try {
      localStorage.setItem('notificationQueue', JSON.stringify(this.notificationQueue));
    } catch (error) {
      console.error('❌ Error saving notification queue:', error);
    }
  }

  private async showNotification(notification: NotificationData): Promise<void> {
    if (!this.swRegistration) throw new Error('Service Worker not registered');

    await this.swRegistration.showNotification(notification.title, {
      body: notification.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notification.groupId, // Group notifications
      renotify: true,
      requireInteraction: notification.priority === 'high',
      data: notification.data
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}

export const notificationService = new NotificationService();
