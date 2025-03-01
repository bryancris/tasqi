
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

// Cache duration in milliseconds
const AUTH_CACHE_DURATION = 60000; // 1 minute

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasShownToast = useRef(false);
  const mounted = useRef(true);
  const initialAuthCheckCompleted = useRef(false);
  const authTimeoutRef = useRef<number | null>(null);
  const lastAuthCheck = useRef<number>(0);
  const authInProgress = useRef<boolean>(false);
  const cachedUserData = useRef<{user: User | null, session: Session | null, timestamp: number} | null>(null);

  // Debounced version of the auth state setter to prevent multiple updates in quick succession
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetAuthState = useCallback(
    debounce((newSession: Session | null, newUser: User | null) => {
      if (!mounted.current) return;

      console.log("Auth state updated (debounced):", { 
        hasSession: !!newSession,
        hasUser: !!newUser, 
        userId: newUser?.id
      });

      setSession(newSession);
      setUser(newUser);
      
      // Only set loading to false after initial auth check is completed
      if (!initialAuthCheckCompleted.current) {
        initialAuthCheckCompleted.current = true;
        setLoading(false);
      }

      if ((newSession || newUser) && !hasShownToast.current) {
        toast.success("Successfully signed in", {
          id: "auth-success",
          duration: 3000,
        });
        hasShownToast.current = true;
      }
    }, 100),
    []
  );

  // Function to fetch and update authentication state with caching and debouncing
  const refreshAuthState = useCallback(async (force = false) => {
    // Skip if auth check is already in progress or if cache is still valid
    const now = Date.now();
    if (
      authInProgress.current || 
      (!force && 
       cachedUserData.current && 
       now - cachedUserData.current.timestamp < AUTH_CACHE_DURATION)
    ) {
      // Use cached data if it's still valid
      if (cachedUserData.current) {
        console.log("Using cached auth data:", {
          hasSession: !!cachedUserData.current.session,
          hasUser: !!cachedUserData.current.user,
          cacheAge: now - cachedUserData.current.timestamp
        });
        
        debouncedSetAuthState(cachedUserData.current.session, cachedUserData.current.user);
      }
      return;
    }

    // Rate limit auth checks
    if (!force && now - lastAuthCheck.current < 1000) {
      console.log("Auth check throttled, too frequent");
      return;
    }

    try {
      // Set flag to prevent concurrent auth checks
      authInProgress.current = true;
      lastAuthCheck.current = now;
      
      console.log("Refreshing auth state...");
      
      // Get session first, which is more lightweight
      const { data: { session: newSession } } = await supabase.auth.getSession();
      
      // If no session found, clear the user as well
      if (!newSession) {
        cachedUserData.current = { session: null, user: null, timestamp: now };
        
        if (mounted.current) {
          debouncedSetAuthState(null, null);
        }
        
        console.log("No active session found");
        return;
      }
      
      // Only fetch user data if we have a session
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      console.log("Auth refresh complete:", { 
        hasSession: !!newSession, 
        hasUser: !!newUser,
        userId: newUser?.id
      });

      // Cache the data
      cachedUserData.current = { session: newSession, user: newUser, timestamp: now };

      if (mounted.current) {
        debouncedSetAuthState(newSession, newUser);
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      if (mounted.current) {
        // Ensure loading is set to false even on error
        initialAuthCheckCompleted.current = true;
        setLoading(false);
      }
    } finally {
      authInProgress.current = false;
    }
  }, [debouncedSetAuthState]);

  useEffect(() => {
    // Initial auth state fetch
    console.log("Initializing auth state...");
    
    // Try to restore from localStorage first for faster initial render
    try {
      const storedSession = localStorage.getItem('sb-session');
      const storedUser = localStorage.getItem('sb-user');
      
      if (storedSession && storedUser) {
        const parsedSession = JSON.parse(storedSession);
        const parsedUser = JSON.parse(storedUser);
        
        if (parsedSession && parsedUser) {
          console.log("Using stored auth data while fetching fresh data");
          setSession(parsedSession);
          setUser(parsedUser);
          // Don't set loading to false yet, we still want to verify the session
        }
      }
    } catch (e) {
      console.warn("Error parsing stored auth data:", e);
    }
    
    // Fetch fresh auth state
    refreshAuthState(true);
    
    // Set safety timeout to ensure loading state doesn't get stuck
    authTimeoutRef.current = window.setTimeout(() => {
      if (loading && mounted.current) {
        console.warn("Auth check timed out, forcing loading to false");
        initialAuthCheckCompleted.current = true;
        setLoading(false);
      }
    }, 5000); // 5 second safety timeout

    // Set up auth state listener with throttling to prevent excessive calls
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change detected:", { event, hasSession: !!session });
      
      // Store session and user data for faster initial loads on subsequent visits
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
        // Clear stored auth data
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-user');
      }
      
      // Refresh auth state, forcing a refresh on important events
      const forceRefresh = ['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event);
      refreshAuthState(forceRefresh);
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
      debouncedSetAuthState.cancel();
      
      // Clear safety timeout
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [refreshAuthState, debouncedSetAuthState, loading]);

  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true); // Set loading to true during sign out
      
      // Clear cached data
      cachedUserData.current = null;
      
      // Clear storage items first to avoid PWA state issues
      try {
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-user');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
      } catch (error) {
        console.error("Error clearing storage:", error);
      }
      
      await supabase.auth.signOut();
      
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasShownToast.current = false; // Reset toast flag on sign out
        setLoading(false); // Make sure loading is set to false after sign out
      }
    } catch (error) {
      console.error("Error signing out:", error);
      if (mounted.current) {
        setLoading(false); // Ensure loading is set to false even on error
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
