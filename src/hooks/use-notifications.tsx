
import { useState, useEffect } from 'react';
import { notificationService } from '@/utils/notifications/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  async function checkSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function enableNotifications() {
    try {
      setIsLoading(true);
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Subscribe to push notifications
      const subscription = await notificationService.subscribe();
      
      if (subscription) {
        setIsSubscribed(true);
        toast.success('Notifications enabled successfully');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    try {
      setIsLoading(true);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
          
        if (error) throw error;
        
        setIsSubscribed(false);
        toast.success('Notifications disabled');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications
  };
}
