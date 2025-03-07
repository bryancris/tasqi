
import { useEffect, useRef } from 'react';
import { useNetworkDetection } from '@/hooks/chat/use-network-detection';

// Constants for network reconnection
export const RECONNECTION_CONSTANTS = {
  // Time between reconnection attempts (15 seconds)
  RECONNECTION_DEBOUNCE_MS: 15000,
  // Maximum reconnection attempts
  MAX_RECONNECTION_ATTEMPTS: 3,
  // Cooldown period after max attempts (1 minute)
  RECONNECTION_COOLDOWN_MS: 60000,
  // Show a human-readable error after this many attempts
  SHOW_ERROR_AFTER_ATTEMPTS: 2,
};

/**
 * Hook that listens to network state changes and calls the provided 
 * callback function when network reconnects
 */
export const useNetworkReconnection = (onReconnect: () => void) => {
  const { isOnline, isNetworkAvailable } = useNetworkDetection();
  const wasOnlineRef = useRef<boolean>(isOnline);
  const lastReconnectTimeRef = useRef<number>(0);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectionTimerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Clear any existing timer to prevent stale callbacks
    if (reconnectionTimerRef.current) {
      window.clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
    
    const now = Date.now();
    const timeSinceLastReconnect = now - lastReconnectTimeRef.current;
    const isStableConnection = timeSinceLastReconnect > RECONNECTION_CONSTANTS.RECONNECTION_DEBOUNCE_MS;
    
    // Only trigger reconnection when:
    // 1. We're detecting a transition from offline to online
    // 2. The connection appears stable (not rapid toggling)
    // 3. We haven't exceeded the max reconnection attempts or we're outside the cooldown period
    if (
      isOnline && 
      !wasOnlineRef.current && 
      isStableConnection &&
      (reconnectAttemptsRef.current < RECONNECTION_CONSTANTS.MAX_RECONNECTION_ATTEMPTS || 
       timeSinceLastReconnect > RECONNECTION_CONSTANTS.RECONNECTION_COOLDOWN_MS)
    ) {
      console.log("Network reconnected, refreshing auth state");
      
      // Reset attempts counter if we're outside the cooldown period
      if (timeSinceLastReconnect > RECONNECTION_CONSTANTS.RECONNECTION_COOLDOWN_MS) {
        reconnectAttemptsRef.current = 0;
      }
      
      // Update attempt counter
      reconnectAttemptsRef.current++;
      lastReconnectTimeRef.current = now;
      
      // Invoke the callback to refresh auth state
      onReconnect();
    }
    
    // Update the reference to current network state
    wasOnlineRef.current = isOnline;
    
    // Cleanup function
    return () => {
      if (reconnectionTimerRef.current) {
        window.clearTimeout(reconnectionTimerRef.current);
        reconnectionTimerRef.current = null;
      }
    };
  }, [isOnline, onReconnect]);
  
  return {
    isOnline,
    isNetworkAvailable
  };
};
