
import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

// Constants
const AUTH_TIMEOUT_MS = 3000; // Reduced from 5000
const AUTH_DEBOUNCE_MS = 200; // Reduced from 300
// Different debounce time for development
const DEV_AUTH_DEBOUNCE_MS = 300; // Reduced from 500
// Maximum auth initialization attempts before forcing completion
const MAX_AUTH_INIT_ATTEMPTS = 3;

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
  const lastRefreshTime = useRef(0);
  const setupAttempted = useRef(false);
  const initAttemptCount = useRef(0);
  const pendingUpdates = useRef<NodeJS.Timeout | null>(null);
  const debugCount = useRef(0);
  const firstSetupTimestamp = useRef(0);
  
  // Use a shorter debounce in dev mode to prevent too many updates
  const debounceTime = isDevelopment ? DEV_AUTH_DEBOUNCE_MS : AUTH_DEBOUNCE_MS;
  
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
    
    return () => {
      // Clear any pending updates on unmount
      if (pendingUpdates.current) {
        clearTimeout(pendingUpdates.current);
        pendingUpdates.current = null;
      }
    };
  }, [isDevelopment]);
  
  // Helper function to handle auth state updates with debouncing
  const updateAuthState = useCallback((newSession: Session | null) => {
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
      
      // Set a timeout to process this update after debounce period
      pendingUpdates.current = setTimeout(() => {
        console.log(`Processing debounced auth update #${debugCount.current}`);
        updateAuthState(newSession);
      }, debounceTime);
      
      return;
    }
    
    lastRefreshTime.current = now;
    
    if (!mounted.current) {
      console.log("Component unmounted, skipping auth state update");
      return;
    }
    
    if (newSession) {
      console.log("Auth state update: session found, updating state");
      setSession(newSession);
      setUser(newSession.user);
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
  }, [setSession, setUser, setLoading, hasToastRef, setInitialized, debounceTime, setAuthError]);

  // Helper to clear auth state
  const clearAuthState = useCallback(() => {
    if (mounted.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      hasToastRef.current = false;
    }
  }, [mounted, setSession, setUser, hasToastRef]);

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
      const checkExistingSession = async () => {
        try {
          console.log("Checking for existing session...");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error retrieving session:", error);
            if (setAuthError) setAuthError(error);
            return;
          }
          
          if (data?.session) {
            console.log("Found existing session during initialization");
            updateAuthState(data.session);
          } else {
            console.log("No existing session found during initialization");
            // In development, set loading to false after a short delay to prevent flicker
            if (isDevelopment) {
              setTimeout(() => {
                if (mounted.current && !authInitialized.current) {
                  console.log("Dev mode: Forcing initialization state after check");
                  clearAuthState();
                  setLoading(false);
                  authInitialized.current = true;
                  if (setInitialized) setInitialized(true);
                }
              }, 800); // Reduced from 1000ms
            }
          }
        } catch (err) {
          console.error("Session check failed:", err);
          if (setAuthError && err instanceof Error) setAuthError(err);
        }
      };
      
      // Start session check
      checkExistingSession();
      
      // Set up the auth state change listener
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
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
          // Handle initial session check
          if (newSession) {
            console.log("Initial session found");
            updateAuthState(newSession);
          } else {
            console.log("No initial session found");
            clearAuthState();
            setLoading(false);
            authInitialized.current = true;
            if (setInitialized) setInitialized(true);
          }
        }
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
      }, AUTH_TIMEOUT_MS + (isDevelopment ? 1000 : 0)); // Reduced from 2000ms additional time
      
      return data.subscription;
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
      setLoading(false);
      authInitialized.current = true;
      if (setInitialized) setInitialized(true);
      if (setAuthError && error instanceof Error) setAuthError(error);
      return null;
    }
  }, [clearAuthState, mounted, setLoading, updateAuthState, isDevelopment, setInitialized, setAuthError]);

  // Cleanup function
  const cleanupAuthSubscription = useCallback(() => {
    // Clear any pending debounced updates
    if (pendingUpdates.current) {
      clearTimeout(pendingUpdates.current);
      pendingUpdates.current = null;
    }
    
    if (authStateSubscription.current) {
      console.log("Unsubscribing from auth state");
      authStateSubscription.current.unsubscribe();
      authStateSubscription.current = null;
    }
  }, []);

  // Return the isInitialized state and the setup/cleanup functions
  return {
    setupAuthSubscription,
    cleanupAuthSubscription,
    isInitialized: authInitialized,
    clearAuthState
  };
};
