
import { useRef } from "react";

/**
 * Constants for reconnection timing
 */
export const RECONNECTION_CONSTANTS = {
  MIN_RECONNECTION_INTERVAL_MS: 30000, // 30 seconds minimum between attempts
  MAX_RECONNECTION_ATTEMPTS: 3, // Maximum consecutive attempts before giving up
  COOLDOWN_PERIOD_MS: 300000, // 5 minutes cooldown after max attempts
};

/**
 * Hook to track network reconnection attempts and throttle them
 */
export const useNetworkReconnection = () => {
  // Track last reconnection attempt
  const lastReconnectionAttempt = useRef(0);
  const reconnectionAttempts = useRef(0);
  const coolingDown = useRef(false);
  const cooldownStartTime = useRef(0);
  
  /**
   * Check if enough time has passed since the last reconnection attempt
   */
  const canAttemptReconnection = () => {
    const now = Date.now();

    // If in cooldown period, check if cooldown has ended
    if (coolingDown.current) {
      const timeSinceCooldownStart = now - cooldownStartTime.current;
      if (timeSinceCooldownStart > RECONNECTION_CONSTANTS.COOLDOWN_PERIOD_MS) {
        // Cooldown period over, reset the state
        coolingDown.current = false;
        reconnectionAttempts.current = 0;
        console.log("Cooldown period ended, reconnection attempts reset");
      } else {
        // Still in cooldown
        console.log(`Still in reconnection cooldown, ${Math.floor((RECONNECTION_CONSTANTS.COOLDOWN_PERIOD_MS - timeSinceCooldownStart) / 1000)}s remaining`);
        return false;
      }
    }
    
    // Check if we've tried too many times in succession
    if (reconnectionAttempts.current >= RECONNECTION_CONSTANTS.MAX_RECONNECTION_ATTEMPTS) {
      console.log(`Maximum reconnection attempts (${RECONNECTION_CONSTANTS.MAX_RECONNECTION_ATTEMPTS}) reached, entering cooldown`);
      coolingDown.current = true;
      cooldownStartTime.current = now;
      return false;
    }
    
    // Check if minimum time between attempts has passed
    const timeSinceLastAttempt = now - lastReconnectionAttempt.current;
    const canAttempt = timeSinceLastAttempt > RECONNECTION_CONSTANTS.MIN_RECONNECTION_INTERVAL_MS;
    
    if (!canAttempt) {
      console.log(`Too soon for reconnection attempt, wait ${Math.floor((RECONNECTION_CONSTANTS.MIN_RECONNECTION_INTERVAL_MS - timeSinceLastAttempt) / 1000)}s more`);
    }
    
    return canAttempt;
  };
  
  /**
   * Mark that a reconnection attempt has been made
   */
  const markReconnectionAttempt = () => {
    lastReconnectionAttempt.current = Date.now();
    reconnectionAttempts.current += 1;
    console.log(`Reconnection attempt #${reconnectionAttempts.current} marked at ${new Date().toISOString()}`);
  };
  
  /**
   * Reset the reconnection attempt counter (call on successful reconnection)
   */
  const resetReconnectionAttempts = () => {
    console.log("Successful reconnection, resetting attempt counter");
    reconnectionAttempts.current = 0;
    coolingDown.current = false;
  };
  
  return {
    canAttemptReconnection,
    markReconnectionAttempt,
    resetReconnectionAttempts,
  };
};
