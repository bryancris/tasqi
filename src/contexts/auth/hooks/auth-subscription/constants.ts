
// Constants for auth subscription management
export const AUTH_TIMEOUT_MS = 5000; // Increased from 2500ms for more reliable auth init
export const AUTH_DEBOUNCE_MS = 300; // Increased from 100ms to reduce flicker 
export const DEV_AUTH_DEBOUNCE_MS = 400; // Increased from 150ms
export const MAX_AUTH_INIT_ATTEMPTS = 2; // Reduced from 3 to fail faster if needed
