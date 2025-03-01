
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
  // Add a flag to prevent multiple refreshes
  const isRefreshing = useRef(false);

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

  // Initialize auth state on mount - only once
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Initial auth check
    if (!isRefreshing.current) {
      isRefreshing.current = true;
      refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef)
        .finally(() => {
          isRefreshing.current = false;
        });
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change detected:", { event, hasSession: !!newSession });
      
      if (event === 'SIGNED_OUT') {
        clearAuthState(mounted, setSession, setUser, hasToastRef);
        console.log("Signed out, auth state cleared");
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
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });
    
    // Force loading to false after a short timeout (failsafe)
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 2000); // Reduced timeout for better UX

    return () => {
      console.log("Auth provider unmounting, cleaning up");
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
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
