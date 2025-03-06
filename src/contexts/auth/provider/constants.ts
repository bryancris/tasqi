
// Constants for the auth provider

// Shorter timeouts for development mode
export const AUTH_TIMEOUT_MS = 2500; // Reduced from 3000ms
export const DEV_MODE_TIMEOUT_ADDITION = 500; // Reduced from 1000ms

// Helper to detect development mode more reliably
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('lovableproject.com');
};
