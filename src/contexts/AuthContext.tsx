
import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      setSession(null); // Clear session state first
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate to home page before signing out
      navigate('/');
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        console.error("Error signing out:", error);
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        
        const currentPath = window.location.pathname;
        if (currentPath === '/auth') {
          setLoading(false);
          return;
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await handleSignOut();
          return;
        }

        if (!initialSession?.user) {
          console.log("No initial session found");
          await handleSignOut();
          return;
        }

        console.log("Initial session found and valid");
        setSession(initialSession);
        
      } catch (error) {
        console.error("Error in auth initialization:", error);
        await handleSignOut();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log("User signed in");
          setSession(currentSession);
          navigate('/dashboard');
          toast.success("Successfully signed in");
          break;
          
        case 'SIGNED_OUT':
          console.log("User signed out");
          setSession(null);
          navigate('/');
          break;
          
        case 'TOKEN_REFRESHED':
          console.log("Token refreshed");
          if (currentSession) {
            setSession(currentSession);
          } else {
            setSession(null);
            navigate('/');
          }
          break;
          
        case 'USER_UPDATED':
          console.log("User profile updated");
          setSession(currentSession);
          break;
        
        case 'INITIAL_SESSION':
          console.log("Initial session loaded");
          if (currentSession) {
            setSession(currentSession);
          } else {
            setSession(null);
            navigate('/');
          }
          break;
          
        case 'PASSWORD_RECOVERY':
          setSession(null);
          navigate('/');
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
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
