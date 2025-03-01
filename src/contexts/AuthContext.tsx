
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  handleSignOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  handleSignOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasToastRef = useRef(false);
  const mounted = useRef(true);

  // Simple function to fetch auth state - no caching, no early returns
  const refreshAuth = useCallback(async () => {
    if (!mounted.current) return;
    
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      // Update session state
      const currentSession = sessionData?.session;
      
      if (currentSession) {
        // If we have a session, get user data
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (mounted.current) {
          setSession(currentSession);
          setUser(userData?.user || null);
          
          // Show toast only once after successful authentication
          if (userData?.user && !hasToastRef.current) {
            toast.success("Successfully signed in", {
              id: "auth-success",
              duration: 3000,
            });
            hasToastRef.current = true;
          }
        }
      } else {
        // No session found
        if (mounted.current) {
          setSession(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      if (mounted.current) {
        setSession(null);
        setUser(null);
      }
    } finally {
      // Always update loading state when done
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

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
    refreshAuth();
    
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
        refreshAuth();
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [refreshAuth]);

  const contextValue = React.useMemo(
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
