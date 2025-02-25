
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private periodicSyncInterval = 15; // minutes

  async initialize(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Enable background sync if supported
      if ('sync' in this.swRegistration) {
        await this.setupBackgroundSync();
      }

      // Enable periodic sync if supported
      if ('periodicSync' in this.swRegistration) {
        await this.setupPeriodicSync();
      }

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
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

      // Get the push subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const response = await fetch('/api/notifications/vapid-public-key');
        const vapidPublicKey = await response.text();
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        });
      }

      // Store subscription in Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscription.endpoint,
        p256dh_key: subscription.getKey('p256dh'),
        auth_key: subscription.getKey('auth'),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        throw error;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable notifications');
      return null;
    }
  }

  private async setupBackgroundSync(): Promise<void> {
    try {
      await this.swRegistration?.sync.register('sync-notifications');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
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
        console.log('Periodic sync registered');
      }
    } catch (error) {
      console.error('Periodic sync registration failed:', error);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}

export const notificationService = new NotificationService();
