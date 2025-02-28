
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/utils/notifications/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Standard web notifications implementation
 * Handles notifications for standard web platforms that fully support Push API
 */
export function useWebNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status for standard web platforms
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First try service worker subscription
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log('✅ Web push subscription found');
            setIsSubscribed(true);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error checking service worker push subscription:', err);
        }
      }
      
      // As a fallback, check the database
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: subs, error } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);
          
        if (!error && subs && subs.length > 0) {
          console.log('✅ Push subscription found in database');
          setIsSubscribed(true);
        } else {
          console.log('ℹ️ No push subscription found');
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking web subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check when component mounts
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  async function enableNotifications() {
    try {
      setIsLoading(true);
      console.log('🌐 Setting up standard web notifications');
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Try to subscribe
      const subscription = await notificationService.subscribe();
      
      if (subscription) {
        console.log('✅ Web notifications enabled successfully!');
        setIsSubscribed(true);
        toast.success('Notifications enabled successfully');
        return true;
      } else {
        throw new Error('Failed to create notification subscription');
      }
    } catch (error) {
      console.error('Error enabling web notifications:', error);
      setIsSubscribed(false);
      toast.error(error instanceof Error ? error.message : 'Failed to enable notifications. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    try {
      setIsLoading(true);
      
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            await subscription.unsubscribe();
            
            // Also try to remove subscription from Supabase
            try {
              const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);
                
              if (error) console.warn('Error removing subscription from database:', error);
            } catch (error) {
              console.warn('Error in database operation:', error);
            }
          }
          
          setIsSubscribed(false);
          toast.success('Notifications disabled');
          return true;
        } catch (error) {
          console.error('Error unsubscribing from push:', error);
          throw error;
        }
      } else {
        // If service worker isn't available, just update the UI
        setIsSubscribed(false);
        toast.success('Notifications disabled');
        return true;
      }
    } catch (error) {
      console.error('Error disabling web notifications:', error);
      toast.error('Failed to disable notifications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus
  };
}
