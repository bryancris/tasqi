
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
  const hasShownToast = useRef(false);
  const mounted = useRef(true);

  // Memoize setAuthState to prevent unnecessary re-renders
  const setAuthState = useCallback((newSession: Session | null, newUser: User | null) => {
    if (!mounted.current) return;

    console.log("Auth state updated:", { 
      hasSession: !!newSession,
      hasUser: !!newUser, 
      userId: newUser?.id
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
  }, []);

  // Function to fetch and update authentication state
  const refreshAuthState = useCallback(async () => {
    try {
      console.log("Refreshing auth state...");
      // Get both session and user data for redundancy
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ]);

      const newSession = sessionResult.data.session;
      const newUser = userResult.data.user;
      
      console.log("Auth refresh complete:", { 
        hasSession: !!newSession, 
        hasUser: !!newUser,
        userId: newUser?.id
      });

      if (mounted.current) {
        setAuthState(newSession, newUser);
      }
    } catch (error) {
      console.error("Error refreshing auth state:", error);
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [setAuthState]);

  useEffect(() => {
    // Initial auth state fetch
    console.log("Initializing auth state...");
    refreshAuthState();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change detected:", { event, hasSession: !!session });
      
      if (mounted.current) {
        // Get user directly when auth state changes
        const { data } = await supabase.auth.getUser();
        console.log("User data after auth state change:", { hasUser: !!data.user, userId: data.user?.id });
        setAuthState(session, data.user);
      }
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [refreshAuthState, setAuthState]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasShownToast.current = false; // Reset toast flag on sign out
      }
    } catch (error) {
      console.error("Error signing out:", error);
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
