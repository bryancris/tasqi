
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
    // Initialize session from local storage if available
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes('Invalid Refresh Token')) {
            // Clear the session if refresh token is invalid
            await supabase.auth.signOut();
            setSession(null);
            navigate('/auth');
          } else {
            console.error("Error getting session:", error);
          }
          setLoading(false);
          return;
        }
        setSession(initialSession);
        setLoading(false);
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        setSession(currentSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        navigate('/auth');
        toast.success("You have been logged out");
      } else if (event === 'SIGNED_IN') {
        setSession(currentSession);
        navigate('/dashboard');
        toast.success("Successfully signed in");
      } else if (event === 'USER_UPDATED') {
        console.log("User profile updated");
        setSession(currentSession);
      } else if (event === 'INITIAL_SESSION') {
        setSession(currentSession);
        if (currentSession) {
          navigate('/dashboard');
        }
      }

      setLoading(false);
    });

    // Cleanup subscription
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
