
// Constants for the auth provider

// Shorter timeouts for development mode
export const AUTH_TIMEOUT_MS = 2000; // Reduced from 2500ms
export const DEV_MODE_TIMEOUT_ADDITION = 300; // Reduced from 500ms

// Helper to detect development mode more reliably
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('lovableproject.com');
};

// Helper to check dev auth bypass
export const isDevAuthBypassed = () => {
  try {
    return (
      isDevelopmentMode() &&
      sessionStorage.getItem('dev_bypass_auth') === 'true' &&
      sessionStorage.getItem('force_auth_initialized') === 'true'
    );
  } catch (e) {
    return false;
  }
};
