
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const unsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        if (initialSession && !hasShownToast.current) {
          hasShownToast.current = true;
          toast.success("Successfully signed in", {
            id: "auth-success",
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          setSession(currentSession);
        }
      );
      unsubscribe.current = () => subscription.unsubscribe();
    };

    initializeAuth();
    setupAuthListener();

    return () => {
      if (unsubscribe.current) {
        unsubscribe.current();
      }
    };
  }, []); // Empty dependency array - only run once

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      hasShownToast.current = false;
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const contextValue = React.useMemo(
    () => ({
      session,
      loading,
      handleSignOut,
    }),
    [session, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
