
import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

// Constants
const AUTH_TIMEOUT_MS = 5000;
const AUTH_DEBOUNCE_MS = 300;

type AuthSubscriptionProps = {
  mounted: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
};

export const useAuthSubscription = ({
  mounted,
  setSession,
  setUser,
  setLoading,
  hasToastRef,
}: AuthSubscriptionProps) => {
  // Refs for tracking state
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const authInitialized = useRef(false);
  const lastRefreshTime = useRef(0);
  const setupAttempted = useRef(false);
  
  // Helper function to handle auth state updates with debouncing
  const updateAuthState = useCallback((newSession: Session | null) => {
    const now = Date.now();
    
    // Debounce rapidly firing auth updates
    if (now - lastRefreshTime.current < AUTH_DEBOUNCE_MS) {
      console.log('Debouncing auth update');
      return;
    }
    
    lastRefreshTime.current = now;
    
    if (newSession) {
      console.log("Auth state update: session found, updating state");
      setSession(newSession);
      setUser(newSession.user);
      setLoading(false);
      
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
    }
  }, [setSession, setUser, setLoading, hasToastRef]);

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
    if (authStateSubscription.current || setupAttempted.current) {
      console.log("Auth subscription already set up or attempted, skipping");
      return null;
    }

    setupAttempted.current = true;
    console.log("Setting up auth state subscription");
    
    try {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
        
        if (!mounted.current) return;
        
        if (event === 'SIGNED_OUT') {
          clearAuthState();
          console.log("Signed out, auth state cleared");
          setLoading(false);
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
          }
          
          // Mark as initialized
          authInitialized.current = true;
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
        }
      }, AUTH_TIMEOUT_MS);
      
      return data.subscription;
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
      setLoading(false);
      authInitialized.current = true;
      return null;
    }
  }, [clearAuthState, mounted, setLoading, updateAuthState]);

  // Cleanup function
  const cleanupAuthSubscription = useCallback(() => {
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
