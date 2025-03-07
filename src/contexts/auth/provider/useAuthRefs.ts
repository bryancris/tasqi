import { useRef } from "react";
import { isDevelopmentMode, isDevAuthBypassed, isAuthForceInitialized } from "./constants";

/**
 * Hook to manage all refs used in auth provider
 */
export const useAuthRefs = () => {
  // Core state refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  
  // Subscription tracking
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Initialization state tracking
  const authSetupAttempt = useRef(false);
  const authSetupComplete = useRef(false);
  const initializationCount = useRef(0);
  const isDevMode = useRef(isDevelopmentMode());
  const devBypassEnabled = useRef(isDevAuthBypassed());
  const authForceInitialized = useRef(isAuthForceInitialized());
  
  // Timekeeping
  const lastMountTimestamp = useRef(Date.now());
  
  // Manual check status (for dev mode)
  const manualSessionCheckComplete = useRef(false);
  const manualSessionFound = useRef<boolean | null>(null);

  return {
    mounted,
    hasToastRef,
    authStateSubscription,
    authSetupAttempt,
    authSetupComplete,
    initializationCount,
    isDevMode,
    devBypassEnabled,
    authForceInitialized,
    lastMountTimestamp,
    manualSessionCheckComplete,
    manualSessionFound
  };
};
