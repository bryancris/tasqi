
import { useRef } from "react";

/**
 * Constants for reconnection timing
 */
export const RECONNECTION_CONSTANTS = {
  MIN_RECONNECTION_INTERVAL_MS: 30000, // 30 seconds minimum between attempts
  MAX_RECONNECTION_ATTEMPTS: 3, // Maximum consecutive attempts before giving up
};

/**
 * Hook to track network reconnection attempts and throttle them
 */
export const useNetworkReconnection = () => {
  // Track last reconnection attempt
  const lastReconnectionAttempt = useRef(0);
  const reconnectionAttempts = useRef(0);
  
  /**
   * Check if enough time has passed since the last reconnection attempt
   */
  const canAttemptReconnection = () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastReconnectionAttempt.current;
    
    // Don't attempt if we've tried too many times in succession
    if (reconnectionAttempts.current >= RECONNECTION_CONSTANTS.MAX_RECONNECTION_ATTEMPTS) {
      console.log(`Maximum reconnection attempts (${RECONNECTION_CONSTANTS.MAX_RECONNECTION_ATTEMPTS}) reached, cooling down`);
      return false;
    }
    
    return timeSinceLastAttempt > RECONNECTION_CONSTANTS.MIN_RECONNECTION_INTERVAL_MS;
  };
  
  /**
   * Mark that a reconnection attempt has been made
   */
  const markReconnectionAttempt = () => {
    lastReconnectionAttempt.current = Date.now();
    reconnectionAttempts.current += 1;
  };
  
  /**
   * Reset the reconnection attempt counter (call on successful reconnection)
   */
  const resetReconnectionAttempts = () => {
    reconnectionAttempts.current = 0;
  };
  
  return {
    canAttemptReconnection,
    markReconnectionAttempt,
    resetReconnectionAttempts,
  };
};
