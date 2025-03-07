
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
  const isInitializingRef = useRef(true);
  const lastRefreshTime = useRef(0);
  const pendingRefresh = useRef<NodeJS.Timeout | null>(null);
  
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

  // Simple debounce for auth state updates to prevent multiple rapid refreshes
  const debouncedAuthUpdate = (fn: () => void, delay = 300) => {
    if (pendingRefresh.current) {
      clearTimeout(pendingRefresh.current);
    }
    
    pendingRefresh.current = setTimeout(() => {
      fn();
      pendingRefresh.current = null;
    }, delay);
  };

  // Get current session and set up auth listener
  useEffect(() => {
    console.log("Auth provider initializing");
    
    // Set a timeout to prevent endless loading state
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading && !initialized) {
        console.log("Auth initialization timed out, forcing completion");
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // Reduced from 5000ms
    
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
            isInitializingRef.current = false;
            
            // Show success toast only once
            if (!hasToastRef.current) {
              toast.success("Successfully signed in");
              hasToastRef.current = true;
              window.localStorage.setItem('auth_success', 'true');
            }
          }
        } else {
          console.log("No session found during initialization");
          // Just set initialized
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitialized(true);
            isInitializingRef.current = false;
            window.localStorage.removeItem('auth_success');
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        if (mounted.current) {
          setLoading(false);
          setInitialized(true);
          isInitializingRef.current = false;
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
      
      // Prevent multiple rapid updates
      const now = Date.now();
      if (now - lastRefreshTime.current < 300) {
        console.log("Debouncing rapid auth event");
        
        // For important events, still process but with debounce
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          debouncedAuthUpdate(() => {
            handleAuthStateChange(event, newSession);
          });
        }
        
        return;
      }
      
      lastRefreshTime.current = now;
      handleAuthStateChange(event, newSession);
    });
    
    // Helper to handle auth state changes
    function handleAuthStateChange(event: string, newSession: Session | null) {
      if (!mounted.current) return;
      
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
      else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && newSession) {
        console.log(`${event} event received`);
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
        }
      }
    }
    
    // Clean up on unmount
    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      
      if (pendingRefresh.current) {
        clearTimeout(pendingRefresh.current);
        pendingRefresh.current = null;
      }
      
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
