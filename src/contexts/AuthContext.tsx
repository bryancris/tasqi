import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { debounce } from "lodash";

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

// Cache duration in milliseconds - reduced to improve performance
const AUTH_CACHE_DURATION = 10000; // 10 seconds cache

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasShownToast = useRef(false);
  const mounted = useRef(true);
  const authInProgress = useRef<boolean>(false);
  const lastAuthCheck = useRef<number>(0);
  const cachedUserData = useRef<{user: User | null, session: Session | null, timestamp: number} | null>(null);

  // Faster debounced version of the auth state setter
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetAuthState = useCallback(
    debounce((newSession: Session | null, newUser: User | null) => {
      if (!mounted.current) return;

      console.log("Auth state updated:", { 
        hasSession: !!newSession,
        hasUser: !!newUser 
      });

      setSession(newSession);
      setUser(newUser);
      setLoading(false);
      
      if ((newSession || newUser) && !hasShownToast.current) {
        toast.success("Successfully signed in", {
          id: "auth-success",
          duration: 3000,
        });
        hasShownToast.current = true;
      }
    }, 50), // Reduced debounce time for faster updates
    []
  );

  // Optimized function to fetch and update authentication state
  const refreshAuthState = useCallback(async (force = false) => {
    // Skip if auth check is already in progress
    const now = Date.now();
    if (authInProgress.current) return;
    
    // Use cached data if still valid (unless forced)
    if (!force && 
        cachedUserData.current && 
        now - cachedUserData.current.timestamp < AUTH_CACHE_DURATION) {
      debouncedSetAuthState(cachedUserData.current.session, cachedUserData.current.user);
      return;
    }

    // Rate limit auth checks
    if (!force && now - lastAuthCheck.current < 500) {
      return;
    }

    try {
      // Set flag to prevent concurrent auth checks
      authInProgress.current = true;
      lastAuthCheck.current = now;
      
      // Get session and user data
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      // If no session found, clear user as well
      if (!newSession) {
        cachedUserData.current = { session: null, user: null, timestamp: now };
        
        if (mounted.current) {
          debouncedSetAuthState(null, null);
        }
        return;
      }
      
      // Only fetch user data if we have a session
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      // Cache the data
      cachedUserData.current = { session: newSession, user: newUser, timestamp: now };

      if (mounted.current) {
        debouncedSetAuthState(newSession, newUser);
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      if (mounted.current) {
        setLoading(false);
      }
    } finally {
      authInProgress.current = false;
    }
  }, [debouncedSetAuthState]);

  useEffect(() => {
    // Initial auth state fetch - try to restore from localStorage first
    try {
      const storedSession = localStorage.getItem('sb-session');
      const storedUser = localStorage.getItem('sb-user');
      
      if (storedSession && storedUser) {
        const parsedSession = JSON.parse(storedSession);
        const parsedUser = JSON.parse(storedUser);
        
        if (parsedSession && parsedUser) {
          console.log("Using stored auth data");
          setSession(parsedSession);
          setUser(parsedUser);
          // We still need to verify the session, so keep loading true
        }
      }
    } catch (e) {
      console.warn("Error parsing stored auth data:", e);
    }
    
    // Fetch fresh auth state
    refreshAuthState(true);
    
    // Safety timeout to ensure loading state doesn't get stuck
    const timeoutId = window.setTimeout(() => {
      if (loading && mounted.current) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 3000); // Reduced from 5s to 3s

    // Set up auth state listener with simple throttling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change detected:", { event, hasSession: !!session });
      
      // Store session data for faster initial loads
      if (session && event === 'SIGNED_IN') {
        try {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            localStorage.setItem('sb-session', JSON.stringify(session));
            localStorage.setItem('sb-user', JSON.stringify(data.user));
          }
        } catch (e) {
          console.warn("Error storing auth data:", e);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-user');
      }
      
      // Force refresh on important events
      const forceRefresh = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
      refreshAuthState(forceRefresh);
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
      debouncedSetAuthState.cancel();
      clearTimeout(timeoutId);
    };
  }, [refreshAuthState, debouncedSetAuthState, loading]);

  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
      // Clear cached data
      cachedUserData.current = null;
      
      // Clear storage items first
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
        hasShownToast.current = false;
        setLoading(false);
      }
    } catch (error) {
      console.error("Error signing out:", error);
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

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
