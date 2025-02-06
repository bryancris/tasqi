
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
    const handleInvalidSession = async () => {
      console.log("Handling invalid session");
      // Clear any existing session data
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      setSession(null);
      setLoading(false);
      navigate('/auth');
    };

    // Initialize session from local storage if available
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('token_not_found') || 
              error.message.includes('refresh_token_not_found')) {
            console.log("Invalid refresh token detected, clearing session");
            toast.error("Session expired. Please sign in again.");
            await handleInvalidSession();
          }
          return;
        }

        if (initialSession) {
          console.log("Initial session found and valid");
          setSession(initialSession);
        } else {
          console.log("No initial session found");
          await handleInvalidSession();
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        await handleInvalidSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, !!currentSession);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed successfully");
        setSession(currentSession);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        await handleInvalidSession();
        toast.success("You have been logged out");
      } else if (event === 'SIGNED_IN') {
        console.log("User signed in");
        setSession(currentSession);
        navigate('/dashboard');
        toast.success("Successfully signed in");
      } else if (event === 'USER_UPDATED') {
        console.log("User profile updated");
        setSession(currentSession);
      } else if (event === 'INITIAL_SESSION') {
        if (currentSession) {
          console.log("Initial session restored");
          setSession(currentSession);
          navigate('/dashboard');
        } else {
          console.log("No initial session found");
          await handleInvalidSession();
        }
      }

      setLoading(false);
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
