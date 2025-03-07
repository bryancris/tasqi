
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { supabase } from "@/integrations/supabase/client";

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const authCheckInProgress = useRef(false);
  const lastAuthEventTime = useRef(Date.now());
  const authEventThrottleMs = 300; // Throttle rapidly firing auth events
  
  // Network status
  const { isOnline } = useNetworkDetection();

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasToastRef.current = false;
        window.localStorage.removeItem('auth_success');
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Helper for safely updating auth state
  const updateAuthState = (newSession: Session | null) => {
    // Don't update if component unmounted
    if (!mounted.current) return;

    const now = Date.now();
    
    // Throttle rapid updates (prevent race conditions)
    if (now - lastAuthEventTime.current < authEventThrottleMs) {
      // Queue update after throttle period
      setTimeout(() => updateAuthState(newSession), authEventThrottleMs);
      return;
    }
    
    lastAuthEventTime.current = now;
    
    if (newSession) {
      console.log("Updating auth state with session");
      setSession(newSession);
      setUser(newSession.user);
      
      // Show success toast only once
      if (!hasToastRef.current) {
        toast.success("Successfully signed in", {
          id: "auth-success",
          duration: 3000,
        });
        hasToastRef.current = true;
        // Store success flag in localStorage as backup
        window.localStorage.setItem('auth_success', 'true');
      }
    } else {
      setSession(null);
      setUser(null);
      // Only clear flag if explicitly clearing session
      hasToastRef.current = false;
      window.localStorage.removeItem('auth_success');
    }
    
    setLoading(false);
    setInitialized(true);
  };

  // Initialize auth once on mount
  useEffect(() => {
    console.log("Auth provider initializing");
    
    // Prevent multiple simultaneous checks
    if (authCheckInProgress.current) return;
    authCheckInProgress.current = true;
    
    // Set up auth state subscription
    const setupAuth = async () => {
      try {
        // First check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setAuthError(sessionError);
          setLoading(false);
          setInitialized(true);
          authCheckInProgress.current = false;
          return;
        }
        
        // Update state with session if it exists
        if (sessionData?.session) {
          console.log("Found existing session during initialization");
          updateAuthState(sessionData.session);
        } else {
          console.log("No session found during initialization");
          // Check if we have the auth success flag but no session
          const authSuccess = window.localStorage.getItem('auth_success');
          
          if (authSuccess === 'true') {
            console.log("Auth success flag found but no session during initialization, refreshing");
            // Try to refresh the session one more time
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("Error refreshing session:", refreshError);
              // Clear invalid auth state
              window.localStorage.removeItem('auth_success');
              updateAuthState(null);
            } else if (refreshData?.session) {
              console.log("Found session after refresh attempt");
              updateAuthState(refreshData.session);
            } else {
              // If still no session, remove the flag
              window.localStorage.removeItem('auth_success');
              updateAuthState(null);
            }
          } else {
            updateAuthState(null);
          }
        }
        
        // Set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log(`Auth state change event: ${event}`);
          
          if (!mounted.current) return;
          
          if (event === 'SIGNED_OUT') {
            updateAuthState(null);
          } 
          else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && newSession) {
            console.log("Setting session from auth state change", event);
            updateAuthState(newSession);
          }
        });
        
        // Store subscription for cleanup
        authStateSubscription.current = data.subscription;
        
      } catch (error) {
        console.error("Error setting up auth:", error);
        if (error instanceof Error) {
          setAuthError(error);
        }
        setLoading(false);
        setInitialized(true);
      } finally {
        authCheckInProgress.current = false;
      }
    };
    
    // Start auth setup
    setupAuth();
    
    // Cleanup on unmount
    return () => {
      mounted.current = false;
      
      if (authStateSubscription.current) {
        console.log("Cleaning up auth subscription");
        authStateSubscription.current.unsubscribe();
      }
    };
  }, []);
  
  // Handle connectivity changes
  useEffect(() => {
    // When coming back online, refresh auth if we have a session
    if (isOnline && initialized && session) {
      console.log("Network reconnected, refreshing auth state");
      const refreshSession = async () => {
        try {
          // Prevent multiple refreshes
          if (authCheckInProgress.current) return;
          authCheckInProgress.current = true;
          
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (data.session) {
            updateAuthState(data.session);
          } else {
            // Session lost
            updateAuthState(null);
          }
        } catch (error) {
          console.error("Error refreshing session after reconnect:", error);
          // Don't clear auth state on temporary errors
        } finally {
          authCheckInProgress.current = false;
        }
      };
      
      refreshSession();
    }
  }, [isOnline, initialized, session]);

  // Create the context value
  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      error: authError,
      handleSignOut,
    }),
    [session, user, loading, initialized, authError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
