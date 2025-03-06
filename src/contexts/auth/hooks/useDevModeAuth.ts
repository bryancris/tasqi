
import { useRef, useEffect } from "react";

/**
 * Hook to provide development-specific authentication helpers
 * Helps manage hot reloads and development-specific behavior
 */
export const useDevModeAuth = () => {
  // Track when this hook was instantiated
  const mountTimestamp = useRef(Date.now());
  // Track if this is a hot reload 
  const isHotReload = useRef(false);
  // Store last known auth state for recovery
  const lastKnownAuthState = useRef<{
    hasSession: boolean;
    timestamp: number;
  } | null>(null);

  // Use localStorage to persist auth state across hot reloads
  useEffect(() => {
    try {
      // Check for recent auth state in localStorage
      const storedState = localStorage.getItem('dev_auth_state');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        if (parsedState && Date.now() - parsedState.timestamp < 10000) {
          // State is recent (less than 10 seconds old)
          lastKnownAuthState.current = parsedState;
          console.log("Dev mode: Recovered auth state from local storage", parsedState);
        }
      }
    } catch (e) {
      console.warn("Dev mode: Failed to read auth state from localStorage", e);
    }

    // Detect hot reload by checking if there was a recent mount
    const lastMountTime = Number(sessionStorage.getItem('last_auth_mount_time') || '0');
    const currentTime = Date.now();
    
    if (lastMountTime && currentTime - lastMountTime < 3000) {
      console.log("Dev mode: Hot reload detected", { 
        timeSinceLastMount: currentTime - lastMountTime 
      });
      isHotReload.current = true;
    }
    
    // Store current mount time
    sessionStorage.setItem('last_auth_mount_time', currentTime.toString());
    
    return () => {
      // Update timestamp on unmount to help detect hot reloads
      sessionStorage.setItem('last_auth_unmount_time', Date.now().toString());
    };
  }, []);

  // Function to save current auth state to localStorage
  const saveAuthState = (hasSession: boolean) => {
    try {
      const stateToSave = {
        hasSession,
        timestamp: Date.now()
      };
      localStorage.setItem('dev_auth_state', JSON.stringify(stateToSave));
      lastKnownAuthState.current = stateToSave;
    } catch (e) {
      console.warn("Dev mode: Failed to save auth state to localStorage", e);
    }
  };

  // Function to force auth initialization for development
  const forceAuthInitialized = () => {
    try {
      localStorage.setItem('force_auth_initialized', 'true');
    } catch (e) {
      console.warn("Dev mode: Failed to set force_auth_initialized", e);
    }
  };

  // Check if force initialized flag is set
  const checkForceInitialized = () => {
    try {
      return localStorage.getItem('force_auth_initialized') === 'true';
    } catch (e) {
      return false;
    }
  };

  // Clear force initialized flag
  const clearForceInitialized = () => {
    try {
      localStorage.removeItem('force_auth_initialized');
    } catch (e) {
      console.warn("Dev mode: Failed to clear force_auth_initialized", e);
    }
  };

  return {
    isHotReload: isHotReload.current,
    mountTimestamp: mountTimestamp.current,
    lastKnownAuthState: lastKnownAuthState.current,
    saveAuthState,
    forceAuthInitialized,
    checkForceInitialized,
    clearForceInitialized
  };
};
