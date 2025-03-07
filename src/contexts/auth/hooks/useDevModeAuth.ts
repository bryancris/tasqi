
import { useCallback } from "react";

/**
 * Hook for handling development mode authentication testing
 */
export const useDevModeAuth = () => {
  // Check for hot reload
  const isHotReload = (() => {
    try {
      // Only check in development mode
      if (process.env.NODE_ENV !== 'development') return false;
      
      // Check if we've stored a timestamp for hot reload detection
      const lastMountStr = sessionStorage.getItem('auth_last_mount_time');
      if (!lastMountStr) {
        const now = Date.now();
        sessionStorage.setItem('auth_last_mount_time', now.toString());
        return false;
      }
      
      const lastMount = parseInt(lastMountStr, 10);
      const now = Date.now();
      
      // If it's been less than 1 second since last mount, it's likely a hot reload
      const isHotReload = now - lastMount < 1000;
      
      // Update the timestamp
      sessionStorage.setItem('auth_last_mount_time', now.toString());
      
      return isHotReload;
    } catch (e) {
      return false;
    }
  })();
  
  // Get last known auth state from storage
  const lastKnownAuthState = (() => {
    try {
      const stored = localStorage.getItem('dev_auth_state');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (e) {
      return null;
    }
  })();
  
  // Force auth to be initialized in development mode
  const forceAuthInitialized = useCallback(() => {
    try {
      if (process.env.NODE_ENV === 'development') {
        sessionStorage.setItem('force_auth_initialized', 'true');
        console.log("Development mode: Forced auth initialized for future loads");
      }
    } catch (e) {
      console.warn("Could not set force_auth_initialized", e);
    }
  }, []);
  
  // Check if we've forced initialization
  const checkForceInitialized = useCallback(() => {
    try {
      return sessionStorage.getItem('force_auth_initialized') === 'true';
    } catch (e) {
      return false;
    }
  }, []);
  
  // Save current auth state
  const saveAuthState = useCallback((hasSession: boolean) => {
    try {
      localStorage.setItem('dev_auth_state', JSON.stringify({
        hasSession,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn("Could not save auth state", e);
    }
  }, []);
  
  return {
    isHotReload,
    lastKnownAuthState,
    forceAuthInitialized,
    checkForceInitialized,
    saveAuthState
  };
};
