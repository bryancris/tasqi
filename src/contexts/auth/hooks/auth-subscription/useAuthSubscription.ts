import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AUTH_TIMEOUT_MS, AUTH_DEBOUNCE_MS, DEV_AUTH_DEBOUNCE_MS, MAX_AUTH_INIT_ATTEMPTS } from "./constants";

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

// Static reference to track global subscription state
const GLOBAL_AUTH_STATE = {
  subscription: null as { unsubscribe: () => void } | null,
  initialized: false,
  authChecked: false,
  subscriberCount: 0
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
  // Refs for tracking local state
  const pendingUpdates = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTime = useRef(0);
  const debugCount = useRef(0);
  const setupAttempted = useRef(false);
  
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
  const debouncedUpdate = useCallback((
    updateFn: (session: Session | null) => void,
    newSession: Session | null
  ) => {
    const now = Date.now();
    
    // Cancel any pending updates
    if (pendingUpdates.current) {
      clearTimeout(pendingUpdates.current);
      pendingUpdates.current = null;
    }
    
    // Debounce rapidly firing auth updates
    if (now - lastRefreshTime.current < debounceTime) {
      debugCount.current++;
      console.log(`Debouncing auth update #${debugCount.current} (${debounceTime}ms)`);
      
      pendingUpdates.current = setTimeout(() => {
        console.log(`Processing debounced auth update #${debugCount.current}`);
        lastRefreshTime.current = Date.now();
        updateFn(newSession);
      }, debounceTime);
      
      return;
    }
    
    // Otherwise, update immediately
    lastRefreshTime.current = now;
    updateFn(newSession);
  }, [debounceTime]);

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
        GLOBAL_AUTH_STATE.initialized = true;
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
        GLOBAL_AUTH_STATE.initialized = true;
        if (setInitialized) setInitialized(true);
      }
    };
    
    debouncedUpdate(updateState, newSession);
  }, [setSession, setUser, setLoading, hasToastRef, setInitialized, clearAuthState, debouncedUpdate, setAuthError, mounted]);

  // Session checking logic
  const checkExistingSession = useCallback(async () => {
    if (GLOBAL_AUTH_STATE.authChecked) {
      console.log("Session already checked previously, skipping duplicate check");
      return;
    }
    
    try {
      console.log("Checking for existing session...");
      const { data, error } = await supabase.auth.getSession();
      
      // Mark that we've performed a session check globally
      GLOBAL_AUTH_STATE.authChecked = true;
      
      if (error) {
        console.error("Error retrieving session:", error);
        if (setAuthError) setAuthError(error);
        
        // In development, don't get stuck in loading
        if (isDevelopment) {
          setTimeout(() => {
            if (mounted.current) {
              console.log("Dev mode: Error checking session, forcing completion");
              clearAuthState();
              setLoading(false);
              if (setInitialized) setInitialized(true);
              GLOBAL_AUTH_STATE.initialized = true;
            }
          }, 800);
        }
        return;
      }
      
      if (data?.session) {
        console.log("Found existing session during initialization");
        updateAuthState(data.session);
      } else {
        console.log("No existing session found during initialization");
        
        // Explicitly clear state
        clearAuthState();
        
        // In development, set loading to false after a short delay to prevent flicker
        if (isDevelopment) {
          setTimeout(() => {
            if (mounted.current) {
              console.log("Dev mode: No session found, forcing completion");
              setLoading(false);
              if (setInitialized) setInitialized(true);
              GLOBAL_AUTH_STATE.initialized = true;
            }
          }, 500); // Reduced time
        } else {
          // In production, update immediately
          setLoading(false);
          if (setInitialized) setInitialized(true);
          GLOBAL_AUTH_STATE.initialized = true;
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
      if (setAuthError && err instanceof Error) setAuthError(err);
      
      // Make sure we don't get stuck
      setTimeout(() => {
        if (mounted.current) {
          console.log("Error during session check, forcing completion");
          clearAuthState();
          setLoading(false);
          if (setInitialized) setInitialized(true);
          GLOBAL_AUTH_STATE.initialized = true;
        }
      }, 800);
    }
  }, [updateAuthState, clearAuthState, setLoading, setInitialized, setAuthError, mounted, isDevelopment]);

  // Auth event handling
  const handleAuthEvent = useCallback((
    event: string,
    newSession: Session | null
  ) => {
    console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
    
    if (!mounted.current) {
      console.log("Component unmounted, ignoring auth state change");
      return;
    }
    
    if (event === 'SIGNED_OUT') {
      clearAuthState();
      console.log("Signed out, auth state cleared");
      setLoading(false);
      if (setInitialized) setInitialized(true);
      GLOBAL_AUTH_STATE.initialized = true;
    } 
    else if (event === 'SIGNED_IN' && newSession) {
      console.log("Signed in event received with session");
      updateAuthState(newSession);
    } 
    else if (event === 'TOKEN_REFRESHED' && newSession) {
      console.log('Token refreshed successfully');
      updateAuthState(newSession);
    } 
    else if (event === 'USER_UPDATED' && newSession) {
      console.log('User updated');
      updateAuthState(newSession);
    }
    else if (event === 'INITIAL_SESSION') {
      console.log("Initial session check complete");
      if (newSession) {
        console.log("Initial session found");
        updateAuthState(newSession);
      } else {
        console.log("No initial session found");
        clearAuthState();
        setLoading(false);
        if (setInitialized) setInitialized(true);
        GLOBAL_AUTH_STATE.initialized = true;
      }
    }
  }, [clearAuthState, updateAuthState, setLoading, setInitialized, mounted]);

  // Setup auth subscription
  const setupAuthSubscription = useCallback(() => {
    // Track this component as a subscriber
    GLOBAL_AUTH_STATE.subscriberCount++;
    
    // If we already have a global subscription, reuse it
    if (GLOBAL_AUTH_STATE.subscription) {
      console.log(`Reusing existing auth subscription (${GLOBAL_AUTH_STATE.subscriberCount} active subscribers)`);
      
      // If already initialized, update loading state
      if (GLOBAL_AUTH_STATE.initialized) {
        console.log("Auth already initialized, setting loading to false");
        setLoading(false);
        if (setInitialized) setInitialized(true);
      }
      
      return GLOBAL_AUTH_STATE.subscription;
    }
    
    // Prevent multiple setup attempts
    if (setupAttempted.current) {
      console.log("Auth setup already attempted in this component instance");
      return null;
    }
    
    setupAttempted.current = true;
    
    console.log("Setting up NEW auth state subscription", 
                isDevelopment ? "(development mode)" : "");
    
    try {
      // First get current session to handle initial state faster
      checkExistingSession();
      
      // Set up the auth state change listener
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        handleAuthEvent(event, newSession);
      });
      
      // Store the subscription globally
      GLOBAL_AUTH_STATE.subscription = data.subscription;
      console.log("Auth subscription setup successful");
      
      // Set a timeout to ensure we don't get stuck in loading
      setTimeout(() => {
        if (mounted.current && !GLOBAL_AUTH_STATE.initialized) {
          console.log("Auth initialization timed out, forcing to not loading");
          setLoading(false);
          GLOBAL_AUTH_STATE.initialized = true;
          if (setInitialized) setInitialized(true);
        }
      }, AUTH_TIMEOUT_MS + (isDevelopment ? 1000 : 0)); // Additional time for dev mode
      
      return data.subscription;
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
      setLoading(false);
      GLOBAL_AUTH_STATE.initialized = true;
      if (setInitialized) setInitialized(true);
      if (setAuthError && error instanceof Error) setAuthError(error);
      return null;
    }
  }, [checkExistingSession, handleAuthEvent, setLoading, setInitialized, setAuthError, isDevelopment, mounted]);

  // Cleanup function
  const cleanupAuthSubscription = useCallback(() => {
    // Clear any pending debounced updates
    if (pendingUpdates.current) {
      clearTimeout(pendingUpdates.current);
      pendingUpdates.current = null;
    }
    
    // Decrement subscriber count
    GLOBAL_AUTH_STATE.subscriberCount = Math.max(0, GLOBAL_AUTH_STATE.subscriberCount - 1);
    console.log(`Auth subscriber removed (${GLOBAL_AUTH_STATE.subscriberCount} remaining)`);
    
    // Only clean up the global subscription if no active subscribers
    if (GLOBAL_AUTH_STATE.subscriberCount === 0 && GLOBAL_AUTH_STATE.subscription) {
      console.log("All subscribers removed, cleaning up global auth subscription");
      GLOBAL_AUTH_STATE.subscription.unsubscribe();
      GLOBAL_AUTH_STATE.subscription = null;
      GLOBAL_AUTH_STATE.initialized = false;
      GLOBAL_AUTH_STATE.authChecked = false;
      console.log("Global auth state reset");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Auth subscriber component unmounting");
      cleanupAuthSubscription();
    };
  }, [cleanupAuthSubscription]);

  // Return the isInitialized state and the setup/cleanup functions
  return {
    setupAuthSubscription,
    cleanupAuthSubscription,
    isInitialized: { current: GLOBAL_AUTH_STATE.initialized },
    clearAuthState
  };
};
