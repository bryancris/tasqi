
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

// Cache duration in milliseconds - increased to reduce frequent checks
const AUTH_CACHE_DURATION = 30000; // 30 seconds cache

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasShownToast = useRef(false);
  const mounted = useRef(true);
  const lastAuthCheck = useRef<number>(0);
  const cachedUserData = useRef<{user: User | null, session: Session | null, timestamp: number} | null>(null);

  // Optimized function to fetch and update authentication state
  const refreshAuthState = useCallback(async (force = false) => {
    // Skip if already authenticated and not forced
    if (!force && session && user) {
      return;
    }
    
    const now = Date.now();
    
    // Use cached data if still valid (unless forced)
    if (!force && 
        cachedUserData.current && 
        now - cachedUserData.current.timestamp < AUTH_CACHE_DURATION) {
      setSession(cachedUserData.current.session);
      setUser(cachedUserData.current.user);
      setLoading(false);
      return;
    }

    // Rate limit auth checks
    if (!force && now - lastAuthCheck.current < 1000) {
      return;
    }

    try {
      lastAuthCheck.current = now;
      
      // Get session data
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      // If no session found, clear user as well
      if (!newSession) {
        cachedUserData.current = { session: null, user: null, timestamp: now };
        
        if (mounted.current) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }
      
      // Only fetch user data if we have a session
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      // Cache the data
      cachedUserData.current = { session: newSession, user: newUser, timestamp: now };

      if (mounted.current) {
        setSession(newSession);
        setUser(newUser);
        setLoading(false);
        
        // Show toast only once after successful authentication
        if (newUser && !hasShownToast.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasShownToast.current = true;
        }
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [session, user]);

  useEffect(() => {
    // Initial auth state fetch - try to restore from localStorage first for faster initial rendering
    try {
      const storedSession = localStorage.getItem('sb-session');
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession) {
          console.log("Using stored auth data for initial render");
          setSession(parsedSession);
          // We still need to verify with a proper fetch
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
    }, 5000); // Increased timeout for better reliability

    // Set up auth state listener
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
      clearTimeout(timeoutId);
    };
  }, [refreshAuthState, loading]);

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
