
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Session expired. Please sign in again.");
          setSession(null);
          navigate('/auth');
          return;
        }

        if (initialSession) {
          console.log("Initial session found and valid");
          setSession(initialSession);
        } else {
          console.log("No initial session found");
          setSession(null);
          if (window.location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setSession(null);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        setSession(currentSession);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setSession(null);
        navigate('/auth');
        toast.success("You have been logged out");
      } else if (event === 'SIGNED_IN') {
        console.log("User signed in");
        setSession(currentSession);
        navigate('/dashboard');
        toast.success("Successfully signed in");
      } else if (event === 'USER_UPDATED') {
        console.log("User profile updated");
        setSession(currentSession);
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
