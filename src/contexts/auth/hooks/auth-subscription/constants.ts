
// Constants for auth subscription management

export const AUTH_TIMEOUT_MS = 6000; // Increased from 3000
export const AUTH_DEBOUNCE_MS = 200;
export const DEV_AUTH_DEBOUNCE_MS = 300;
export const MAX_AUTH_INIT_ATTEMPTS = 3;

// Dev mode helper
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// Fast-path check for dev mode auth bypass
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

// Helper to save current auth state for fast reload in dev mode
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

// Get the last saved auth state (for development fast reload)
export const getDevAuthState = () => {
  if (!isDevelopmentMode()) return null;
  
  try {
    const stored = localStorage.getItem('dev_auth_state');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if it's recent (last 5 minutes)
      if (parsed && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        return parsed;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};
