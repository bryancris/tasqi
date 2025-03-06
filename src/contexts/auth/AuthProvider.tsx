
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { refreshAuth, clearAuthState } from "./authUtils";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasToastRef = useRef(false);
  const mounted = useRef(true);
  // Tracking flags
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const maxRefreshTimeMs = useRef(500); // Debounce period
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const refreshAttemptCount = useRef(0);
  const maxRefreshAttempts = 3;

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
      // Unsubscribe from auth state first to prevent extra callbacks during signout
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear auth state
      clearAuthState(mounted, setSession, setUser, hasToastRef);
      
      console.log("Sign out complete");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      if (mounted.current) {
        setLoading(false);
        // Reset refresh attempt counter
        refreshAttemptCount.current = 0;
      }
    }
  }, []);

  // Setup auth subscription only once
  const setupAuthSubscription = useCallback(() => {
    if (authStateSubscription.current) {
      console.log("Auth subscription already exists, skipping setup");
      return;
    }

    console.log("Setting up auth state subscription");
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`Auth state change detected: ${event}, hasSession: ${!!newSession}`);
      
      if (!mounted.current) return;
      
      // Clear any stored refresh timer to prevent racing conditions
      if (event === 'SIGNED_OUT') {
        clearAuthState(mounted, setSession, setUser, hasToastRef);
        console.log("Signed out, auth state cleared");
        setLoading(false);
        refreshAttemptCount.current = 0;
      } else if (event === 'SIGNED_IN' && newSession) {
        // If we have a session from the event, use it
        setSession(newSession);
        setUser(newSession.user);
        setLoading(false);
        refreshAttemptCount.current = 0;
        
        // Show success toast on sign in
        if (!hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        console.log('Token refreshed successfully');
        setSession(newSession);
        setUser(newSession.user);
        setLoading(false);
        refreshAttemptCount.current = 0;
      } else if (event === 'INITIAL_SESSION') {
        if (newSession) {
          console.log("Initial session found");
          setSession(newSession);
          setUser(newSession.user);
          
          if (!hasToastRef.current && !session) {
            toast.success("Successfully signed in", {
              id: "auth-success",
              duration: 3000,
            });
            hasToastRef.current = true;
          }
        } else {
          console.log("No initial session found");
          // Force loading to false after INITIAL_SESSION event
          // to prevent getting stuck on loading screens
          setLoading(false);
        }
      }
    });
    
    authStateSubscription.current = data.subscription;
    return data.subscription;
  }, [session]);

  // Perform one-time auth check on mount
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Setup auth state listener first
    setupAuthSubscription();
    
    // Then check current auth state - only once
    const checkAuthOnce = async () => {
      if (isRefreshing.current) return;
      
      try {
        isRefreshing.current = true;
        refreshAttemptCount.current += 1;
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          clearAuthState(mounted, setSession, setUser, hasToastRef);
          setLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("Initial auth check: Session found");
          setSession(data.session);
          setUser(data.session.user);
          setLoading(false);
        } else {
          console.log("Initial auth check: No session found");
          clearAuthState(mounted, setSession, setUser, hasToastRef);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error during initial auth check:", e);
        clearAuthState(mounted, setSession, setUser, hasToastRef);
      } finally {
        isRefreshing.current = false;
        // Force loading to false after a timeout (failsafe)
        setTimeout(() => {
          if (mounted.current && loading) {
            console.log("Forcing loading to false (timeout)");
            setLoading(false);
          }
        }, 1000);
      }
    };
    
    checkAuthOnce();
    
    // Force loading to false after a timeout (failsafe)
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 2000);

    return () => {
      console.log("Auth provider unmounting, cleaning up");
      mounted.current = false;
      clearTimeout(timeoutId);
      
      // Clean up auth subscription
      if (authStateSubscription.current) {
        console.log("Unsubscribing from auth state on unmount");
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
    };
  }, [setupAuthSubscription, loading]);

  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      handleSignOut,
    }),
    [session, user, loading, handleSignOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
