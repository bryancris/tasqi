
import { useState, useEffect, useCallback } from 'react';

export function useNetworkDetection() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Check if the network is available
  const isNetworkAvailable = useCallback((): boolean => {
    return isOnline;
  }, [isOnline]);

  useEffect(() => {
    // Update network status when it changes
    const handleOnline = () => {
      console.log('Network connection restored');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isNetworkAvailable,
    isOnline
  };
}
