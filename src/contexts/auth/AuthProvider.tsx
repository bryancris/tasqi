
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { refreshAuth } from "./authUtils";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasToastRef = useRef(false);
  const mounted = useRef(true);

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      
      // Clear local storage related to auth
      try {
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-user');
      } catch (error) {
        console.error("Error clearing storage:", error);
      }
      
      await supabase.auth.signOut();
      
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasToastRef.current = false;
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    // Initial auth check
    refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
    
    // Simple timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 3000);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change detected:", { event, hasSession: !!newSession });
      
      if (event === 'SIGNED_OUT') {
        if (mounted.current) {
          setSession(null);
          setUser(null);
          hasToastRef.current = false;
        }
      } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [loading]);

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
