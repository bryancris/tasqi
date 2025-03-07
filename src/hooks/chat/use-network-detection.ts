
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect online/offline status with debouncing to prevent frequent toggles
 */
export const useNetworkDetection = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const lastOnlineState = useRef<boolean>(navigator.onLine);
  const lastOnlineChangeTime = useRef<number>(Date.now());
  const MIN_TIME_BETWEEN_CHANGES_MS = 5000; // 5 second minimum between state changes

  useEffect(() => {
    const handleOnline = () => {
      const now = Date.now();
      // Only update if sufficient time has passed or this is a real state change
      if (
        !lastOnlineState.current || 
        now - lastOnlineChangeTime.current > MIN_TIME_BETWEEN_CHANGES_MS
      ) {
        console.log('Network connection restored (debounced)');
        setIsOnline(true);
        lastOnlineState.current = true;
        lastOnlineChangeTime.current = now;
      }
    };

    const handleOffline = () => {
      const now = Date.now();
      // For offline state, we update immediately for better UX
      if (
        lastOnlineState.current || 
        now - lastOnlineChangeTime.current > MIN_TIME_BETWEEN_CHANGES_MS
      ) {
        console.log('Network connection lost (debounced)');
        setIsOnline(false);
        lastOnlineState.current = false;
        lastOnlineChangeTime.current = now;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add a function to check network availability
  const isNetworkAvailable = () => isOnline;

  return { 
    isOnline,
    isNetworkAvailable 
  };
};
