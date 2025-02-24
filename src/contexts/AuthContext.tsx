
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Single source of truth for auth state
  const setAuthState = useCallback((newSession: Session | null) => {
    setSession(newSession);
    setIsAuthenticated(!!newSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setAuthState(session);
        
        // Only show toast on initial auth, not on every re-render
        if (session && !isAuthenticated) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
        }
      }
    });

    // Auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setAuthState(session);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuthState, isAuthenticated]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuthState(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [setAuthState]);

  const value = {
    session,
    loading,
    handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
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
