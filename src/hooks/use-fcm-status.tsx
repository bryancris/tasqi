
import { useEffect, useState } from 'react';
import { getAndSaveToken } from '@/utils/notifications/tokenManagement';
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

        // Log environment detection
        const isTwinr = isTwinrEnvironment();
        console.log('🔍 Environment Check:', {
          isTwinrEnvironment: isTwinr,
          userAgent: navigator.userAgent,
          platform: navigator.platform
        });

        const tokenResponse = await getAndSaveToken();
        console.log('📱 Token Response:', {
          success: !!tokenResponse,
          platform: tokenResponse?.platform,
          source: tokenResponse?.source
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
