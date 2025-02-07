
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
      await supabase.auth.signOut();
      setSession(null);
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await handleSignOut(); // Properly clean up the session
          return;
        }

        if (initialSession) {
          console.log("Initial session found and valid");
          setSession(initialSession);
          if (window.location.pathname === '/auth') {
            navigate('/dashboard');
          }
        } else {
          console.log("No initial session found");
          setSession(null);
          if (window.location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        await handleSignOut(); // Properly clean up the session
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
          navigate('/auth');
          toast.success("You have been logged out");
          break;
          
        case 'USER_UPDATED':
          console.log("User profile updated");
          setSession(currentSession);
          break;
          
        case 'INITIAL_SESSION':
          console.log("Initial session loaded");
          if (currentSession) {
            setSession(currentSession);
          }
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
