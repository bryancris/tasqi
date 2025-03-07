
import { useState, useEffect, useRef } from 'react';

/**
 * Constants for network detection
 */
const NETWORK_DETECTION_CONSTANTS = {
  MIN_TIME_BETWEEN_CHANGES_MS: 5000, // 5 second minimum between state changes
  DEBOUNCE_ONLINE_MS: 2000,         // Additional debounce for online events
  DEBOUNCE_OFFLINE_MS: 1000         // Shorter debounce for offline events
};

/**
 * Hook to detect online/offline status with debouncing to prevent frequent toggles
 */
export const useNetworkDetection = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const lastOnlineState = useRef<boolean>(navigator.onLine);
  const lastOnlineChangeTime = useRef<number>(Date.now());
  const debounceTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    const clearDebounceTimer = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };

    const handleOnline = () => {
      const now = Date.now();
      // Only update if sufficient time has passed or this is a real state change
      if (
        !lastOnlineState.current || 
        now - lastOnlineChangeTime.current > NETWORK_DETECTION_CONSTANTS.MIN_TIME_BETWEEN_CHANGES_MS
      ) {
        // Clear any existing debounce timer
        clearDebounceTimer();
        
        // Set a debounce timer for online detection to ensure stability
        debounceTimerRef.current = window.setTimeout(() => {
          if (navigator.onLine) {  // Double-check online status before applying
            console.log('Network connection restored (debounced)');
            setIsOnline(true);
            lastOnlineState.current = true;
            lastOnlineChangeTime.current = Date.now();
            debounceTimerRef.current = null;
          }
        }, NETWORK_DETECTION_CONSTANTS.DEBOUNCE_ONLINE_MS);
      }
    };

    const handleOffline = () => {
      const now = Date.now();
      // For offline state, we update with a shorter debounce for better UX
      if (
        lastOnlineState.current || 
        now - lastOnlineChangeTime.current > NETWORK_DETECTION_CONSTANTS.MIN_TIME_BETWEEN_CHANGES_MS
      ) {
        // Clear any existing debounce timer
        clearDebounceTimer();
        
        // Set a shorter debounce timer for offline detection
        debounceTimerRef.current = window.setTimeout(() => {
          if (!navigator.onLine) {  // Double-check offline status before applying
            console.log('Network connection lost (debounced)');
            setIsOnline(false);
            lastOnlineState.current = false;
            lastOnlineChangeTime.current = Date.now();
            debounceTimerRef.current = null;
          }
        }, NETWORK_DETECTION_CONSTANTS.DEBOUNCE_OFFLINE_MS);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearDebounceTimer();
    };
  }, []);

  // Add a function to check network availability
  const isNetworkAvailable = () => isOnline;

  return { 
    isOnline,
    isNetworkAvailable 
  };
};
