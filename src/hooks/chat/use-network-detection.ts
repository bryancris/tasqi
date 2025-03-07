
import { useState, useEffect, useRef } from 'react';

/**
 * Constants for network detection with increased debounce times
 */
const NETWORK_DETECTION_CONSTANTS = {
  // Increased minimum time between state changes to reduce flickering
  MIN_TIME_BETWEEN_CHANGES_MS: 15000, // 15 seconds minimum between state changes 
  // Longer debounce for online events to ensure stability
  DEBOUNCE_ONLINE_MS: 5000,          
  // Faster response for offline events for better UX
  DEBOUNCE_OFFLINE_MS: 2000,
  // How many consecutive checks needed to confirm state change
  CONSECUTIVE_CHECKS_REQUIRED: 2
};

/**
 * Hook to detect online/offline status with improved debouncing
 * to prevent frequent toggles and false positive detections
 */
export const useNetworkDetection = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const lastOnlineState = useRef<boolean>(navigator.onLine);
  const lastOnlineChangeTime = useRef<number>(Date.now());
  const debounceTimerRef = useRef<number | null>(null);
  const consecutiveChecksRef = useRef<number>(0);
  const isInitialMount = useRef<boolean>(true);
  const stabilityTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Log initial state on mount only
    if (isInitialMount.current) {
      console.log(`Network detection initialized, online: ${navigator.onLine}`);
      isInitialMount.current = false;
    }
    
    const clearDebounceTimer = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };

    const clearStabilityTimer = () => {
      if (stabilityTimerRef.current !== null) {
        window.clearTimeout(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
    };

    // Handle stable online transition
    const handleOnline = () => {
      const now = Date.now();
      
      // Only continue if sufficient time has passed since last state change
      // or we're transitioning from a different state
      if (
        !lastOnlineState.current || 
        now - lastOnlineChangeTime.current > NETWORK_DETECTION_CONSTANTS.MIN_TIME_BETWEEN_CHANGES_MS
      ) {
        // Clear any existing timers
        clearDebounceTimer();
        clearStabilityTimer();
        
        // Set a debounce timer for online detection to ensure stability
        debounceTimerRef.current = window.setTimeout(() => {
          // Verify network is actually available with a test request
          verifyNetworkConnection().then(isReachable => {
            if (isReachable && navigator.onLine) {
              consecutiveChecksRef.current++;
              
              // Only update state after consecutive successful checks
              if (consecutiveChecksRef.current >= NETWORK_DETECTION_CONSTANTS.CONSECUTIVE_CHECKS_REQUIRED) {
                // Double-check online status before applying
                if (!lastOnlineState.current) {
                  console.log('Network connection restored (verified)');
                  setIsOnline(true);
                  lastOnlineState.current = true;
                  lastOnlineChangeTime.current = Date.now();
                  consecutiveChecksRef.current = 0;
                  
                  // Set a stability timer - don't allow any state changes during this period
                  stabilityTimerRef.current = window.setTimeout(() => {
                    stabilityTimerRef.current = null;
                  }, NETWORK_DETECTION_CONSTANTS.MIN_TIME_BETWEEN_CHANGES_MS);
                }
              } else {
                // Schedule another check if we need more confirmations
                debounceTimerRef.current = window.setTimeout(handleOnline, 1000);
              }
            } else {
              // Reset consecutive checks counter on failure
              consecutiveChecksRef.current = 0;
            }
            
            debounceTimerRef.current = null;
          });
        }, NETWORK_DETECTION_CONSTANTS.DEBOUNCE_ONLINE_MS);
      }
    };

    // Handle stable offline transition
    const handleOffline = () => {
      const now = Date.now();
      
      // For offline state, we update with a shorter debounce for better UX
      // but still respect the minimum time between changes
      if (
        (lastOnlineState.current || 
        now - lastOnlineChangeTime.current > NETWORK_DETECTION_CONSTANTS.MIN_TIME_BETWEEN_CHANGES_MS) &&
        stabilityTimerRef.current === null // Don't change if in stability period
      ) {
        // Clear any existing debounce timer
        clearDebounceTimer();
        
        // Set a shorter debounce timer for offline detection
        debounceTimerRef.current = window.setTimeout(() => {
          if (!navigator.onLine) {
            // Double-check offline status before applying
            if (lastOnlineState.current) {
              console.log('Network connection lost (verified)');
              setIsOnline(false);
              lastOnlineState.current = false;
              lastOnlineChangeTime.current = Date.now();
            }
          }
          debounceTimerRef.current = null;
        }, NETWORK_DETECTION_CONSTANTS.DEBOUNCE_OFFLINE_MS);
      }
    };

    // Simple network verification with a lightweight request
    // We'll use a HEAD request to a reliable endpoint
    const verifyNetworkConnection = async (): Promise<boolean> => {
      try {
        // Create a controller to timeout the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Make a HEAD request to a reliable endpoint
        const response = await fetch('https://www.gstatic.com/generate_204', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return true;
      } catch (error) {
        console.log('Network verification failed:', error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run an initial verification if browser reports online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearDebounceTimer();
      clearStabilityTimer();
    };
  }, []);

  // Function to check network availability
  const isNetworkAvailable = () => isOnline;

  return { 
    isOnline,
    isNetworkAvailable 
  };
};
