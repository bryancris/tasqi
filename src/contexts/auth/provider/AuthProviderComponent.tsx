
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
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
  const authInitStartTimeRef = useRef(Date.now());
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptCount = useRef(0);
  
  // Sign out handler
  const handleSignOut = async () => {
    try {
      console.log("[AuthProvider] Signing out...");
      await supabase.auth.signOut();
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasToastRef.current = false;
        window.localStorage.removeItem('auth_success');
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("[AuthProvider] Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Get current session and set up auth listener
  useEffect(() => {
    console.log("[AuthProvider] Initializing (SINGLE INSTANCE)");
    
    // Prevent multiple initialization attempts
    initAttemptCount.current += 1;
    if (initAttemptCount.current > 1) {
      console.warn(`[AuthProvider] Detected multiple initialization attempts (${initAttemptCount.current})`);
    }
    
    authInitStartTimeRef.current = Date.now();
    
    // Set a timeout to prevent endless loading state
    authTimeoutRef.current = setTimeout(() => {
      if (mounted.current && loading && !initialized) {
        console.warn("[AuthProvider] Initialization timed out after 3s, forcing completion");
        setLoading(false);
        setInitialized(true);
      }
    }, 3000);
    
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
            window.localStorage.removeItem('auth_success');
          }
        }
      } catch (error) {
        console.error("[AuthProvider] Error during auth initialization:", error);
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
      console.log(`[AuthProvider] Auth state change event: ${event}, hasSession: ${!!newSession}`);
      
      // Skip events if component unmounted
      if (!mounted.current) return;
      
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
      
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
        authSubscription.current = null;
      }
    };
  }, []);

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
