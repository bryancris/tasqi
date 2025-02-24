
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
  const authChecked = useRef(false);
  const toastShown = useRef(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        console.error("Error signing out:", error);
      }
      setSession(null);
      toastShown.current = false;
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession && !toastShown.current) {
          toast.success("Successfully signed in");
          toastShown.current = true;
        }
        setSession(initialSession);
      } finally {
        setLoading(false);
        authChecked.current = true;
      }
    };

    if (!authChecked.current) {
      setupAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        toastShown.current = false;
      } else if (currentSession) {
        setSession(currentSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove session from dependencies

  return (
    <AuthContext.Provider value={{ session, loading, handleSignOut }}>
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
