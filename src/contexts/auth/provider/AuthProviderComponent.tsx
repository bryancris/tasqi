
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { supabase } from "@/integrations/supabase/client";

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Refs for preventing race conditions
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authInitialized = useRef(false);
  const preventMultipleChecks = useRef(false);
  const lastRefreshTime = useRef(0);
  
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

  // Get current session and set up auth listener
  useEffect(() => {
    console.log("Auth provider initializing");
    
    // Prevent double initialization
    if (preventMultipleChecks.current) return;
    preventMultipleChecks.current = true;
    
    // Set a timeout to prevent endless loading state
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading && !initialized) {
        console.log("Auth initialization timed out, forcing completion");
        setLoading(false);
        setInitialized(true);
      }
    }, 5000);
    
    // Check for existing session first
    const getCurrentSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setAuthError(error);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // If we have a session, update state
        if (data?.session) {
          console.log("Found existing session during initialization");
          if (mounted.current) {
            setSession(data.session);
            setUser(data.session.user);
            setLoading(false);
            setInitialized(true);
            authInitialized.current = true;
            
            // Show success toast only once
            if (!hasToastRef.current) {
              toast.success("Successfully signed in");
              hasToastRef.current = true;
              window.localStorage.setItem('auth_success', 'true');
            }
          }
        } else {
          console.log("No session found during initialization");
          // Check for auth success flag (backup for race conditions)
          const authSuccess = window.localStorage.getItem('auth_success');
          
          if (authSuccess === 'true') {
            console.log("Auth success flag found, trying to refresh session");
            // Try to refresh one more time
            const { data: refreshData } = await supabase.auth.refreshSession();
            
            if (refreshData?.session) {
              console.log("Session found after refresh");
              if (mounted.current) {
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                setLoading(false);
                setInitialized(true);
                authInitialized.current = true;
              }
            } else {
              console.log("No session found after refresh, clearing state");
              if (mounted.current) {
                window.localStorage.removeItem('auth_success');
                setSession(null);
                setUser(null);
                setLoading(false);
                setInitialized(true);
                authInitialized.current = true;
              }
            }
          } else {
            // If no session and no auth flag, just set initialized
            if (mounted.current) {
              setSession(null);
              setUser(null);
              setLoading(false);
              setInitialized(true);
              authInitialized.current = true;
            }
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        if (mounted.current) {
          setLoading(false);
          setInitialized(true);
          if (error instanceof Error) {
            setAuthError(error);
          }
        }
      }
    };
    
    // Start session check
    getCurrentSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
      
      // Skip events if component unmounted
      if (!mounted.current) return;
      
      // Debounce rapid auth events
      const now = Date.now();
      if (now - lastRefreshTime.current < 300) {
        console.log("Debouncing rapid auth event");
        return;
      }
      
      lastRefreshTime.current = now;
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        console.log("Signed out event received");
        if (mounted.current) {
          setSession(null);
          setUser(null);
          hasToastRef.current = false;
          window.localStorage.removeItem('auth_success');
          setLoading(false);
          setInitialized(true);
        }
      } 
      else if (event === 'SIGNED_IN' && newSession) {
        console.log("Signed in event received with session");
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
          
          // Show toast only once
          if (!hasToastRef.current) {
            toast.success("Successfully signed in");
            hasToastRef.current = true;
            window.localStorage.setItem('auth_success', 'true');
          }
        }
      }
      else if (event === 'TOKEN_REFRESHED' && newSession) {
        console.log("Token refreshed event received");
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
        }
      }
      else if (event === 'USER_UPDATED' && newSession) {
        console.log("User updated event received");
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
        }
      }
    });
    
    // Clean up on unmount
    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle network connectivity changes
  useEffect(() => {
    // When coming back online, refresh auth if we have a session
    if (isOnline && initialized && session) {
      console.log("Network reconnected, refreshing auth state");
      
      // Prevent excessive refreshes
      const now = Date.now();
      if (now - lastRefreshTime.current < 10000) {
        console.log("Skipping refresh due to recent update");
        return;
      }
      
      lastRefreshTime.current = now;
      
      const refreshSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (data.session) {
            console.log("Session refreshed after network reconnect");
            if (mounted.current) {
              setSession(data.session);
              setUser(data.session.user);
            }
          } else {
            console.log("No session found after network reconnect");
            if (mounted.current) {
              setSession(null);
              setUser(null);
              hasToastRef.current = false;
              window.localStorage.removeItem('auth_success');
            }
          }
        } catch (error) {
          console.error("Error refreshing session after reconnect:", error);
        }
      };
      
      refreshSession();
    }
  }, [isOnline, initialized, session]);

  // Create context value
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
