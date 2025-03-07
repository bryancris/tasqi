
import { useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AUTH_TIMEOUT_MS, AUTH_DEBOUNCE_MS, DEV_AUTH_DEBOUNCE_MS, MAX_AUTH_INIT_ATTEMPTS } from "./constants";
import { useAuthDebounce } from "./useAuthDebounce";
import { useAuthEventHandler } from "./useAuthEventHandler";
import { useSessionCheck } from "./useSessionCheck";

type AuthSubscriptionProps = {
  mounted: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
  setInitialized?: (initialized: boolean) => void;
  setAuthError?: (error: Error | null) => void;
  isDevelopment?: boolean;
};

/**
 * Main hook for managing auth subscription and session state
 */
export const useAuthSubscription = ({
  mounted,
  setSession,
  setUser,
  setLoading,
  hasToastRef,
  setInitialized,
  setAuthError,
  isDevelopment = false,
}: AuthSubscriptionProps) => {
  // Refs for tracking state
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const authInitialized = useRef(false);
  const setupAttempted = useRef(false);
  const initAttemptCount = useRef(0);
  const firstSetupTimestamp = useRef(0);
  
  // Use a shorter debounce in dev mode to prevent too many updates
  const debounceTime = isDevelopment ? DEV_AUTH_DEBOUNCE_MS : AUTH_DEBOUNCE_MS;
  
  // Helper to clear auth state
  const clearAuthState = useCallback(() => {
    if (mounted.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      hasToastRef.current = false;
    }
  }, [mounted, setSession, setUser, hasToastRef]);

  // Auth state update handler (with debouncing)
  const { debouncedUpdate, clearPendingUpdates } = useAuthDebounce({ debounceTime });
  
  // Handle auth state updates
  const updateAuthState = useCallback((newSession: Session | null) => {
    const updateState = (session: Session | null) => {
      if (!mounted.current) {
        console.log("Component unmounted, skipping auth state update");
        return;
      }
      
      if (session) {
        console.log("Auth state update: session found, updating state");
        setSession(session);
        setUser(session.user);
        setLoading(false);
        
        // Clear any auth errors
        if (setAuthError) setAuthError(null);
        
        // Mark as initialized
        authInitialized.current = true;
        if (setInitialized) setInitialized(true);
        
        // Show success toast on sign in (only once)
        if (!hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
      } else {
        // No session found
        console.log("Auth state update: no session found, clearing state");
        clearAuthState();
        setLoading(false);
        
        // Mark as initialized even with no session
        authInitialized.current = true;
        if (setInitialized) setInitialized(true);
      }
    };
    
    debouncedUpdate(updateState, newSession);
  }, [setSession, setUser, setLoading, hasToastRef, setInitialized, clearAuthState, debouncedUpdate, setAuthError, mounted]);

  // Session checking logic
  const { checkExistingSession } = useSessionCheck({
    updateAuthState,
    clearAuthState,
    setLoading,
    setInitialized,
    setAuthError,
    mounted,
    isDevelopment
  });

  // Auth event handling
  const { handleAuthEvent } = useAuthEventHandler({
    updateAuthState,
    clearAuthState,
    setLoading,
    setInitialized,
    mounted
  });

  // Reset attempt counter on hot reload in development
  useEffect(() => {
    if (isDevelopment) {
      const now = Date.now();
      // If this is the first time, set timestamp
      if (firstSetupTimestamp.current === 0) {
        firstSetupTimestamp.current = now;
      }
      // If this hook is re-instantiated within a short time, it's likely a hot reload
      else if (now - firstSetupTimestamp.current < 500) {
        console.log("Detected hook re-instantiation due to hot reload, resetting state");
        setupAttempted.current = false;
        initAttemptCount.current = 0;
      }
    }
  }, [isDevelopment]);

  // Setup auth subscription
  const setupAuthSubscription = useCallback(() => {
    // Never setup twice
    if (authStateSubscription.current) {
      console.log("Auth subscription already exists, reusing it");
      return authStateSubscription.current;
    }
    
    if (setupAttempted.current && initAttemptCount.current >= MAX_AUTH_INIT_ATTEMPTS) {
      console.log(`Max setup attempts (${MAX_AUTH_INIT_ATTEMPTS}) reached, forcing completion`);
      setLoading(false);
      if (setInitialized) setInitialized(true);
      authInitialized.current = true;
      return null;
    }

    setupAttempted.current = true;
    initAttemptCount.current++;
    
    console.log("Setting up auth state subscription", 
                isDevelopment ? "(development mode)" : "",
                `attempt ${initAttemptCount.current}/${MAX_AUTH_INIT_ATTEMPTS}`);
    
    try {
      // First get current session to handle initial state faster
      checkExistingSession();
      
      // Set up the auth state change listener
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        handleAuthEvent(event, newSession);
      });
      
      // Store the subscription for cleanup
      authStateSubscription.current = data.subscription;
      console.log("Auth subscription setup successful");
      
      // Set a timeout to ensure we don't get stuck in loading
      setTimeout(() => {
        if (mounted.current && !authInitialized.current) {
          console.log("Auth initialization timed out, forcing to not loading");
          setLoading(false);
          authInitialized.current = true;
          if (setInitialized) setInitialized(true);
        }
      }, AUTH_TIMEOUT_MS + (isDevelopment ? 1000 : 0)); // Additional time for dev mode
      
      return data.subscription;
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
      setLoading(false);
      authInitialized.current = true;
      if (setInitialized) setInitialized(true);
      if (setAuthError && error instanceof Error) setAuthError(error);
      return null;
    }
  }, [checkExistingSession, handleAuthEvent, setLoading, setInitialized, setAuthError, isDevelopment, mounted]);

  // Cleanup function
  const cleanupAuthSubscription = useCallback(() => {
    // Clear any pending debounced updates
    clearPendingUpdates();
    
    if (authStateSubscription.current) {
      console.log("Unsubscribing from auth state");
      authStateSubscription.current.unsubscribe();
      authStateSubscription.current = null;
    }
  }, [clearPendingUpdates]);

  // Return the isInitialized state and the setup/cleanup functions
  return {
    setupAuthSubscription,
    cleanupAuthSubscription,
    isInitialized: authInitialized,
    clearAuthState
  };
};
