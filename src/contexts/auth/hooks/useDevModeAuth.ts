
import { useCallback } from "react";
import { 
  isDevelopmentMode,
  forceAuthInitialized,
  isAuthForceInitialized,
  saveDevAuthState,
  getDevAuthState
} from "../provider/constants";

/**
 * Hook for handling development mode authentication testing
 */
export const useDevModeAuth = () => {
  // Check for hot reload
  const isHotReload = (() => {
    try {
      // Only check in development mode
      if (!isDevelopmentMode()) return false;
      
      // Check if we've stored a timestamp for hot reload detection
      const lastMountStr = sessionStorage.getItem('auth_last_mount_time');
      if (!lastMountStr) {
        const now = Date.now();
        sessionStorage.setItem('auth_last_mount_time', now.toString());
        return false;
      }
      
      const lastMount = parseInt(lastMountStr, 10);
      const now = Date.now();
      
      // If it's been less than 2 seconds since last mount, it's likely a hot reload
      const isHotReload = now - lastMount < 2000;
      
      // Update the timestamp
      sessionStorage.setItem('auth_last_mount_time', now.toString());
      
      return isHotReload;
    } catch (e) {
      return false;
    }
  })();
  
  // Get last known auth state from storage
  const lastKnownAuthState = getDevAuthState();
  
  // Force auth to be initialized in development mode
  const forceAuthInitializedFn = useCallback((value = true) => {
    forceAuthInitialized(value);
  }, []);
  
  // Check if we've forced initialization
  const checkForceInitialized = useCallback(() => {
    return isAuthForceInitialized();
  }, []);
  
  // Save current auth state
  const saveAuthState = useCallback((hasSession: boolean) => {
    saveDevAuthState(hasSession);
  }, []);
  
  // Clear dev mode auth state
  const clearDevAuthState = useCallback(() => {
    try {
      if (isDevelopmentMode()) {
        localStorage.removeItem('dev_auth_state');
        sessionStorage.removeItem('force_auth_initialized');
        sessionStorage.removeItem('dev_bypass_auth');
        console.log("Development mode: Cleared all auth state");
      }
    } catch (e) {
      console.warn("Could not clear dev auth state", e);
    }
  }, []);
  
  // Check if dev mode bypass is enabled
  const isDevBypassEnabled = useCallback(() => {
    try {
      return isDevelopmentMode() && 
             sessionStorage.getItem('dev_bypass_auth') === 'true';
    } catch (e) {
      return false;
    }
  }, []);
  
  // Helper to enable dev mode bypass quickly
  const enableDevBypass = useCallback(() => {
    try {
      if (isDevelopmentMode()) {
        sessionStorage.setItem('dev_bypass_auth', 'true');
        forceAuthInitialized(true);
        console.log("Development mode: Enabled auth bypass and forced initialization");
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Could not enable dev bypass", e);
      return false;
    }
  }, []);
  
  return {
    isHotReload,
    lastKnownAuthState,
    forceAuthInitialized: forceAuthInitializedFn,
    checkForceInitialized,
    saveAuthState,
    clearDevAuthState,
    isDevBypassEnabled,
    enableDevBypass,
    isDevelopmentMode: isDevelopmentMode()
  };
};
