
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
  const authInitialized = useRef(false);

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
      // Clear local storage related to auth
      try {
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-user');
      } catch (error) {
        console.error("Error clearing storage:", error);
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
      }
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Avoid multiple initializations
    if (authInitialized.current) {
      console.log("Auth already initialized, skipping");
      return;
    }
    
    authInitialized.current = true;
    
    // Initial auth check
    refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
    
    // Simple timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 5000); // Increased timeout for slower connections

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change detected:", { event, hasSession: !!newSession });
      
      if (event === 'SIGNED_OUT') {
        clearAuthState(mounted, setSession, setUser, hasToastRef);
        console.log("Signed out, auth state cleared");
      } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        // For these events, refresh the auth state
        refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session
        if (newSession) {
          if (mounted.current) {
            setSession(newSession);
            setUser(newSession.user);
            setLoading(false);
          }
        } else {
          // No initial session
          if (mounted.current) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
        }
      }
    });

    return () => {
      console.log("Auth provider unmounting, cleaning up");
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []); // Remove the loading dependency to prevent infinite loops

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
