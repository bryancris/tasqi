
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
  const hasInitialized = useRef(false);
  const hasShownInitialToast = useRef(false);

  const handleSignOut = async () => {
    try {
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        console.error("Error signing out:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await handleSignOut();
          return;
        }

        if (mounted) {
          setSession(initialSession);
          setLoading(false);
          
          if (initialSession && !hasShownInitialToast.current) {
            toast.success("Successfully signed in");
            hasShownInitialToast.current = true;
          }
        }

      } catch (error) {
        console.error("Error in auth setup:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log("Auth state change:", event, !!currentSession);

      switch (event) {
        case 'SIGNED_IN':
          if (!session) {
            setSession(currentSession);
            if (!hasShownInitialToast.current) {
              toast.success("Successfully signed in");
              hasShownInitialToast.current = true;
            }
          }
          break;
          
        case 'SIGNED_OUT':
          setSession(null);
          hasShownInitialToast.current = false;
          if (currentSession === null) {
            toast.error("Your session has expired. Please sign in again.");
          }
          break;
          
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (currentSession && JSON.stringify(currentSession) !== JSON.stringify(session)) {
            setSession(currentSession);
          }
          break;
      }
    });

    setupAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove session dependency to prevent loops

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
