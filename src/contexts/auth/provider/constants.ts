
// Constants for the auth provider

// Longer timeouts for all modes, especially development
export const AUTH_TIMEOUT_MS = 8000; // Increased from 2000
export const DEV_MODE_TIMEOUT_ADDITION = 4000; // Increased from 300

// Helper to detect development mode more reliably
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// Helper to check dev auth bypass - simplified and more reliable
export const isDevAuthBypassed = () => {
  try {
    return (
      isDevelopmentMode() &&
      sessionStorage.getItem('dev_bypass_auth') === 'true'
    );
  } catch (e) {
    return false;
  }
};

// Helper to force auth initialization state for development
export const forceAuthInitialized = (value = true) => {
  if (!isDevelopmentMode()) return;
  
  try {
    if (value) {
      sessionStorage.setItem('force_auth_initialized', 'true');
      console.log("Development mode: Forced auth initialized for future loads");
    } else {
      sessionStorage.removeItem('force_auth_initialized');
      console.log("Development mode: Removed forced auth initialization");
    }
  } catch (e) {
    console.warn("Could not set force_auth_initialized", e);
  }
};

// Check if auth is force-initialized
export const isAuthForceInitialized = () => {
  try {
    return sessionStorage.getItem('force_auth_initialized') === 'true';
  } catch (e) {
    return false;
  }
};

// Save auth state for faster reloads in dev mode
export const saveDevAuthState = (hasSession: boolean) => {
  if (!isDevelopmentMode()) return;
  
  try {
    localStorage.setItem('dev_auth_state', JSON.stringify({
      hasSession,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Could not save auth state", e);
  }
};

// Get last known auth state
export const getDevAuthState = () => {
  if (!isDevelopmentMode()) return null;
  
  try {
    const stored = localStorage.getItem('dev_auth_state');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if it's recent (last 10 minutes)
      if (parsed && Date.now() - parsed.timestamp < 10 * 60 * 1000) {
        return parsed;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};
