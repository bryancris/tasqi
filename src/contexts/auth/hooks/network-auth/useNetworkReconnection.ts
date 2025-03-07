import { useRef, useCallback } from "react";

/**
 * Constants for reconnection timing with more conservative values
 */
export const RECONNECTION_CONSTANTS = {
  // Increased minimum time between reconnection attempts
  MIN_RECONNECTION_INTERVAL_MS: 60000, // 1 minute minimum between attempts
  // Reduced maximum consecutive attempts
  MAX_RECONNECTION_ATTEMPTS: 2, // Only try twice before entering cooldown
  // Extended cooldown period after max attempts
  COOLDOWN_PERIOD_MS: 600000, // 10 minutes cooldown after max attempts
  // New: state recording
  STATE_RECORDING_INTERVAL_MS: 5000 // Record state every 5 seconds
};

/**
 * Hook to track network reconnection attempts with improved throttling
 */
export const useNetworkReconnection = () => {
  // Track last reconnection attempt
  const lastReconnectionAttempt = useRef(0);
  const reconnectionAttempts = useRef(0);
  const coolingDown = useRef(false);
  const cooldownStartTime = useRef(0);
  const isReconnecting = useRef(false);
  const reconnectionStartTime = useRef(0);
  
  // Record network state for stability analysis
  const lastNetworkStates = useRef<Array<{time: number, online: boolean}>>([]);
  
  /**
   * Records the current network state for stability analysis
   */
  const recordNetworkState = useCallback((online: boolean) => {
    const now = Date.now();
    
    // Add current state to history
    lastNetworkStates.current.push({
      time: now,
      online
    });
    
    // Keep only recent history (last 2 minutes)
    const twoMinutesAgo = now - 120000;
    lastNetworkStates.current = lastNetworkStates.current.filter(
      state => state.time >= twoMinutesAgo
    );
  }, []);
  
  /**
   * Checks if the network connection appears stable based on recent history
   */
  const isNetworkStable = useCallback(() => {
    const now = Date.now();
    const recentStates = lastNetworkStates.current.filter(
      state => state.time >= now - 30000 // Last 30 seconds
    );
    
    // Not enough data points
    if (recentStates.length < 3) return true;
    
    // Check if all recent states are the same
    const allOnline = recentStates.every(state => state.online);
    const allOffline = recentStates.every(state => !state.online);
    
    // Network is stable if all states are consistently online or offline
    return allOnline || allOffline;
  }, []);
  
  /**
   * Check if enough time has passed since the last reconnection attempt
   * and if we haven't exceeded the maximum attempts
   */
  const canAttemptReconnection = useCallback((forceCheck = false) => {
    const now = Date.now();

    // If already in the process of reconnecting, prevent new attempts
    if (isReconnecting.current && !forceCheck) {
      const reconnectionDuration = now - reconnectionStartTime.current;
      const isStuck = reconnectionDuration > 30000; // 30 seconds timeout
      
      if (!isStuck) {
        console.log(`Reconnection already in progress (${Math.floor(reconnectionDuration / 1000)}s), waiting for completion`);
        return false;
      } else {
        // Reset stuck reconnection attempt
        console.log("Reconnection attempt appears stuck, allowing new attempt");
        isReconnecting.current = false;
      }
    }
    
    // If network looks unstable, prevent reconnection attempts
    if (!isNetworkStable() && !forceCheck) {
      console.log("Network connection appears unstable, delaying reconnection attempt");
      return false;
    }

    // If in cooldown period, check if cooldown has ended
    if (coolingDown.current) {
      const timeSinceCooldownStart = now - cooldownStartTime.current;
      if (timeSinceCooldownStart > RECONNECTION_CONSTANTS.COOLDOWN_PERIOD_MS) {
        // Cooldown period over, reset the state
        coolingDown.current = false;
        reconnectionAttempts.current = 0;
        console.log("Reconnection cooldown period ended, attempts reset");
      } else {
        // Still in cooldown
        const remainingTime = Math.floor((RECONNECTION_CONSTANTS.COOLDOWN_PERIOD_MS - timeSinceCooldownStart) / 1000);
        console.log(`In reconnection cooldown, ${remainingTime}s remaining`);
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
      const waitTime = Math.floor((RECONNECTION_CONSTANTS.MIN_RECONNECTION_INTERVAL_MS - timeSinceLastAttempt) / 1000);
      console.log(`Too soon for reconnection attempt, wait ${waitTime}s more`);
    }
    
    return canAttempt;
  }, [isNetworkStable]);
  
  /**
   * Mark that a reconnection attempt has been made
   */
  const markReconnectionAttempt = useCallback(() => {
    lastReconnectionAttempt.current = Date.now();
    reconnectionAttempts.current += 1;
    isReconnecting.current = true;
    reconnectionStartTime.current = Date.now();
    console.log(`Reconnection attempt #${reconnectionAttempts.current} started at ${new Date().toISOString()}`);
  }, []);
  
  /**
   * Mark that a reconnection has completed (successfully or not)
   */
  const markReconnectionComplete = useCallback((successful: boolean) => {
    isReconnecting.current = false;
    
    if (successful) {
      console.log("Successful reconnection, resetting attempt counter");
      reconnectionAttempts.current = 0;
      coolingDown.current = false;
    } else {
      console.log(`Reconnection attempt #${reconnectionAttempts.current} failed`);
    }
  }, []);
  
  return {
    canAttemptReconnection,
    markReconnectionAttempt,
    markReconnectionComplete,
    recordNetworkState,
    isNetworkStable
  };
};
