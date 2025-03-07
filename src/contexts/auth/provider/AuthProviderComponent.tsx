
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
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const pendingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastEvent = useRef<string | null>(null);
  const authInitalized = useRef(false);
  
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
    console.log("[AuthProvider] Initializing (SINGLE INSTANCE)");
    
    // Set a timeout to prevent endless loading state
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading && !initialized) {
        console.log("[AuthProvider] Initialization timed out, forcing completion");
        setLoading(false);
        setInitialized(true);
      }
    }, 2500);
    
    // Check for existing session first
    const getCurrentSession = async () => {
      try {
        console.log("[AuthProvider] Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthProvider] Error getting session:", error);
          setAuthError(error);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // If we have a session, update state
        if (data?.session) {
          console.log("[AuthProvider] Found existing session");
          if (mounted.current) {
            setSession(data.session);
            setUser(data.session.user);
            setLoading(false);
            setInitialized(true);
            authInitalized.current = true;
            
            // Show success toast only once
            if (!hasToastRef.current) {
              toast.success("Successfully signed in");
              hasToastRef.current = true;
              window.localStorage.setItem('auth_success', 'true');
            }
          }
        } else {
          console.log("[AuthProvider] No session found");
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitialized(true);
            authInitalized.current = true;
            window.localStorage.removeItem('auth_success');
          }
        }
      } catch (error) {
        console.error("[AuthProvider] Error during auth initialization:", error);
        if (mounted.current) {
          setLoading(false);
          setInitialized(true);
          authInitalized.current = true;
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
      console.log(`[AuthProvider] Auth state change event: ${event}, hasSession: ${!!newSession}`);
      
      // Skip events if component unmounted
      if (!mounted.current) return;
      
      // Prevent handling duplicate events
      if (lastEvent.current === event && Date.now() - new Date().getTime() < 300) {
        console.log("[AuthProvider] Skipping duplicate event");
        return;
      }
      
      lastEvent.current = event;
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        console.log("[AuthProvider] Signed out event received");
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
        console.log("[AuthProvider] Signed in event received with session");
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
        console.log(`[AuthProvider] Token refreshed event received`);
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
        }
      }
      else if (event === 'USER_UPDATED' && newSession) {
        console.log('[AuthProvider] User updated event received');
        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false);
          setInitialized(true);
        }
      }
      else if (event === 'INITIAL_SESSION') {
        console.log("[AuthProvider] Initial session check: ", newSession ? "Session exists" : "No session");
        if (newSession) {
          if (mounted.current) {
            setSession(newSession);
            setUser(newSession.user);
            setLoading(false);
            setInitialized(true);
            authInitalized.current = true;
            
            // Show success toast only once
            if (!hasToastRef.current) {
              toast.success("Successfully signed in");
              hasToastRef.current = true;
              window.localStorage.setItem('auth_success', 'true');
            }
          }
        } else {
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setLoading(false);
            setInitialized(true);
            authInitalized.current = true;
          }
        }
      }
    });
    
    // Store auth subscription for cleanup
    authSubscription.current = subscription;
    
    // Clean up on unmount
    return () => {
      console.log("[AuthProvider] Cleaning up");
      mounted.current = false;
      clearTimeout(timeoutId);
      
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
      }
      
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
    };
  }, []);
  
  // Handle network connectivity changes
  useEffect(() => {
    // When coming back online, refresh auth if we have a session
    if (isOnline && initialized && session) {
      console.log("[AuthProvider] Network reconnected, refreshing auth state");
      
      const refreshSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (data.session) {
            console.log("[AuthProvider] Session refreshed after reconnect");
            if (mounted.current) {
              setSession(data.session);
              setUser(data.session.user);
            }
          } else {
            console.log("[AuthProvider] No session found after reconnect");
            if (mounted.current) {
              setSession(null);
              setUser(null);
              hasToastRef.current = false;
              window.localStorage.removeItem('auth_success');
            }
          }
        } catch (error) {
          console.error("[AuthProvider] Error refreshing session after reconnect:", error);
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
