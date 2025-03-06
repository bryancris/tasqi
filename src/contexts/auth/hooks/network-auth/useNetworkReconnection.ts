
import { useRef } from "react";

/**
 * Constants for reconnection timing
 */
export const RECONNECTION_CONSTANTS = {
  MIN_RECONNECTION_INTERVAL_MS: 5000, // 5 seconds minimum between attempts
};

/**
 * Hook to track network reconnection attempts and throttle them
 */
export const useNetworkReconnection = () => {
  // Track last reconnection attempt
  const lastReconnectionAttempt = useRef(0);
  
  /**
   * Check if enough time has passed since the last reconnection attempt
   */
  const canAttemptReconnection = () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastReconnectionAttempt.current;
    
    return timeSinceLastAttempt > RECONNECTION_CONSTANTS.MIN_RECONNECTION_INTERVAL_MS;
  };
  
  /**
   * Mark that a reconnection attempt has been made
   */
  const markReconnectionAttempt = () => {
    lastReconnectionAttempt.current = Date.now();
  };
  
  return {
    canAttemptReconnection,
    markReconnectionAttempt,
  };
};
