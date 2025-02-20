
import { useEffect, useState } from 'react';
import { setupPushSubscription } from '@/utils/notifications/subscriptionUtils';
import { isTwinrEnvironment } from '@/utils/notifications/platformDetection';
import { toast } from '@/components/ui/use-toast';

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
      toast({
        title: "Error",
        description: "Failed to set up notifications. Please check browser permissions.",
        variant: "destructive",
      });
      callback?.(false);
    }
  };

  useEffect(() => {
    async function checkStatus() {
      try {
        setIsLoading(true);
        setFcmStatus('loading');
        setError(null);

        const isTwinr = isTwinrEnvironment();
        console.log('🔍 Environment Check:', {
          isTwinrEnvironment: isTwinr,
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
