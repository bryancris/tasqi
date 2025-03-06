
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
  // Add flags to prevent multiple refreshes and track auth state
  const isRefreshing = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
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
      }
    }
  }, []);

  // Setup auth subscription - separate from initial auth check
  const setupAuthSubscription = useCallback(() => {
    if (authStateSubscription.current) {
      console.log("Auth subscription already exists, skipping setup");
      return;
    }

    console.log("Setting up auth state subscription");
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change detected:", { event, hasSession: !!newSession });
      
      if (!mounted.current) return;
      
      if (event === 'SIGNED_OUT') {
        clearAuthState(mounted, setSession, setUser, hasToastRef);
        console.log("Signed out, auth state cleared");
        setLoading(false);
      } else if (newSession) {
        // If we have a session from the event, use it
        setSession(newSession);
        setUser(newSession.user);
        setLoading(false);
        
        // Show success toast on sign in
        if (event === 'SIGNED_IN' && !hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
      } else if (event === 'INITIAL_SESSION' && !newSession) {
        // No initial session and no previous session set
        if (session === null) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    });
    
    authStateSubscription.current = data.subscription;
    return data.subscription;
  }, [session]);

  // Initialize auth state on mount - only once
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Initial auth check - debounced to prevent rapid refreshes
    if (!isRefreshing.current) {
      isRefreshing.current = true;
      
      // Set up auth state listener first
      const subscription = setupAuthSubscription();
      
      // Then perform initial auth check
      refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef)
        .finally(() => {
          setTimeout(() => {
            isRefreshing.current = false;
          }, 300); // Add debounce to prevent rapid refreshes
        });
    }
    
    // Force loading to false after a timeout (failsafe)
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 1500); // Reduced timeout for better UX

    return () => {
      console.log("Auth provider unmounting, cleaning up");
      mounted.current = false;
      clearTimeout(timeoutId);
      
      // Clean up auth subscription
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
    };
  }, []); // Empty dependency array to run only once

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
