
// Constants for auth subscription
export const AUTH_TIMEOUT_MS = 5000;
export const AUTH_DEBOUNCE_MS = 300;
export const DEV_AUTH_DEBOUNCE_MS = 500;
export const MAX_AUTH_INIT_ATTEMPTS = 3;

// Global storage for auth state to prevent races
export const GLOBAL_AUTH_STATE = {
  subscription: null as { unsubscribe: () => void } | null,
  initialized: false,
  authChecked: false,
  subscriberCount: 0,
  sessionData: null as any
};
