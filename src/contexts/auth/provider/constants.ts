
// Constants for the auth provider
export const AUTH_TIMEOUT_MS = 3000; // Timeout for auth initialization
export const DEV_MODE_TIMEOUT_ADDITION = 1000; // Extra time for development mode

// Helper to detect development mode more reliably
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};
