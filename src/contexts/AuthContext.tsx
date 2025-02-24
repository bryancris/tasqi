
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  handleSignOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  handleSignOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hasShownToast = useRef(false);
  const mounted = useRef(true);

  // Memoize setAuthState to prevent unnecessary re-renders
  const setAuthState = useCallback((newSession: Session | null) => {
    if (!mounted.current) return;

    setSession(newSession);
    setLoading(false);

    if (newSession && !hasShownToast.current) {
      toast.success("Successfully signed in", {
        id: "auth-success",
        duration: 3000,
      });
      hasShownToast.current = true;
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted.current) {
        setAuthState(session);
      }
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) {
        setAuthState(session);
      }
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [setAuthState]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      if (mounted.current) {
        setSession(null);
        hasShownToast.current = false; // Reset toast flag on sign out
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const contextValue = React.useMemo(
    () => ({
      session,
      loading,
      handleSignOut,
    }),
    [session, loading, handleSignOut]
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
