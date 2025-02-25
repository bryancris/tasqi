
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

      if (this.swRegistration.active) {
        this.swRegistration.active.postMessage({ type: 'TAKE_CONTROL' });
      }

      await this.loadQueuedNotifications();

      if ('sync' in (this.swRegistration as any)) {
        await this.setupBackgroundSync();
      }

      if ('periodicSync' in this.swRegistration) {
        await this.setupPeriodicSync();
      }

      this.processNotificationQueue();
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await window.Notification.requestPermission();
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

      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        const { data: vapidConfig, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
        
        if (vapidError || !vapidConfig?.publicKey) {
          throw new Error('Failed to get VAPID configuration');
        }

        const applicationServerKey = this.urlBase64ToUint8Array(vapidConfig.publicKey);
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      this.scheduleSubscriptionRenewal(subscription);

      const keys = subscription.getKey ? {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      } : undefined;

      if (!keys) {
        throw new Error('Failed to get subscription keys');
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        auth_keys: keys,
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
        keys
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable notifications');
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
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
    const expirationTime = subscription.expirationTime;
    if (expirationTime) {
      const timeUntilRenewal = expirationTime - Date.now() - (24 * 60 * 60 * 1000);
      setTimeout(() => this.renewSubscription(), timeUntilRenewal);
    } else {
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
        this.notificationQueue.shift();
        this.saveNotificationQueue();
      } catch (error) {
        console.error('❌ Error processing notification:', error);
        
        if (notification.retries < this.MAX_RETRIES) {
          notification.retries++;
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        } else {
          this.notificationQueue.shift();
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
      tag: notification.groupId,
      renotify: true,
      requireInteraction: notification.priority === 'high',
      data: notification.data
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary);
  }
}

export const notificationService = new NotificationService();
