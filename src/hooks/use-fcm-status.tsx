
import { useEffect, useState } from 'react';
import { setupPushSubscription } from '@/utils/notifications/subscriptionUtils';
import { toast } from 'sonner';

export function useFCMStatus() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fcmStatus, setFcmStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const handleReminderToggle = async (enabled: boolean, callback?: (enabled: boolean) => void) => {
    try {
      if (enabled) {
        setFcmStatus('loading');
        await setupPushSubscription();
        setFcmStatus('ready');
        setIsEnabled(true);
      } else {
        setIsEnabled(false);
      }
      callback?.(enabled);
    } catch (err) {
      console.error('❌ Push notification setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup push notifications');
      setFcmStatus('error');
      setIsEnabled(false);
      toast.error("Failed to set up notifications. Please check browser permissions.");
      callback?.(false);
    }
  };

  useEffect(() => {
    async function checkStatus() {
      try {
        setIsLoading(true);
        setFcmStatus('loading');
        setError(null);

        console.log('🔍 Environment Check:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        });

        const tokenResponse = await setupPushSubscription();
        console.log('📱 Token setup response:', {
          success: !!tokenResponse
        });

        setIsEnabled(!!tokenResponse);
        setFcmStatus(tokenResponse ? 'ready' : 'error');
      } catch (err) {
        console.error('❌ Push notification setup failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup push notifications');
        setFcmStatus('error');
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, []);

  return { isEnabled, isLoading, error, fcmStatus, handleReminderToggle };
}
