
import { useEffect, useState } from 'react';
import { setupPushSubscription } from '@/utils/notifications/subscriptionUtils';
import { isTwinrEnvironment } from '@/utils/notifications/platformDetection';

export function useFCMStatus() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        setIsLoading(true);
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
      } catch (err) {
        console.error('❌ Push notification setup failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup push notifications');
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, []);

  return { isEnabled, isLoading, error };
}
