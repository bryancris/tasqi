
import { createContext, useContext, useEffect, useState } from "react";
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialAuth, setIsInitialAuth] = useState(true);

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
    let isSubscribed = true;

    const setupAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await handleSignOut();
          return;
        }

        if (isSubscribed) {
          setSession(initialSession);
          setLoading(false);
        }

      } catch (error) {
        console.error("Error in auth setup:", error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Setup initial auth state
    setupAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isSubscribed) return;

      console.log("Auth state changed:", event, currentSession?.user?.email);

      switch (event) {
        case 'SIGNED_IN':
          setSession(currentSession);
          if (isInitialAuth) {
            toast.success("Successfully signed in");
            setIsInitialAuth(false);
          }
          break;
          
        case 'SIGNED_OUT':
          setSession(null);
          if (currentSession === null) {
            toast.error("Your session has expired. Please sign in again.");
          }
          break;
          
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          if (currentSession) {
            setSession(currentSession);
          }
          break;
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [isInitialAuth]); // Only depends on isInitialAuth flag

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
