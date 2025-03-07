
// Constants for auth subscription management

// Export timeouts from provider constants
export { AUTH_TIMEOUT_MS } from "../../provider/constants";

// Debounce constants
export const AUTH_DEBOUNCE_MS = 200;
export const DEV_AUTH_DEBOUNCE_MS = 300;
export const MAX_AUTH_INIT_ATTEMPTS = 3;

// Re-export from provider constants
export { 
  isDevelopmentMode,
  isDevAuthBypassed,
  saveDevAuthState,
  getDevAuthState,
  forceAuthInitialized,
  isAuthForceInitialized
} from "../../provider/constants";
