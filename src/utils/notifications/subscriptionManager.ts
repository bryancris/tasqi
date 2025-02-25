
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationSubscription } from "./types";
import { urlBase64ToUint8Array, arrayBufferToBase64 } from "./utils";

export class SubscriptionManager {
  constructor(private swRegistration: ServiceWorkerRegistration) {}

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

        const applicationServerKey = urlBase64ToUint8Array(vapidConfig.publicKey);
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      this.scheduleSubscriptionRenewal(subscription);

      const keys = subscription.getKey ? {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      } : undefined;

      if (!keys) {
        throw new Error('Failed to get subscription keys');
      }

      await this.saveSubscription(subscription.endpoint, keys);

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

  private async saveSubscription(endpoint: string, keys: { p256dh: string; auth: string }): Promise<void> {
    const { error } = await supabase.from('push_subscriptions').upsert({
      endpoint,
      auth_keys: keys,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      platform: 'web',
      device_type: 'web',
      active: true,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language
      },
      metadata: {
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent
      },
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    console.log('✅ Push subscription saved successfully');
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
}
