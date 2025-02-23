
import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const authSubscriptionRef = useRef<any>(null);

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
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        
        // Check if we're on the password reset flow
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        const isRecoveryFlow = hash.includes('type=recovery') || searchParams.get('type') === 'recovery';
        
        if (isRecoveryFlow) {
          console.log("Password recovery flow detected");
          setLoading(false);
          return;
        }

        // Get the initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          await handleSignOut();
          return;
        }

        if (!initialSession?.user) {
          console.log("No initial session found");
          setSession(null);
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

    // Initialize auth
    initializeAuth();

    // Set up auth state subscription
    if (!authSubscriptionRef.current) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        switch (event) {
          case 'SIGNED_IN':
            if (!session) { // Only update if there's no existing session
              console.log("User signed in");
              setSession(currentSession);
              if (isInitialAuth) {
                toast.success("Successfully signed in");
                setIsInitialAuth(false);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            console.log("User signed out");
            setSession(null);
            if (currentSession === null) {
              toast.error("Your session has expired. Please sign in again.");
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log("Token refreshed");
            if (currentSession) {
              setSession(currentSession);
            }
            break;
            
          case 'USER_UPDATED':
            console.log("User profile updated");
            setSession(currentSession);
            break;
          
          case 'INITIAL_SESSION':
            console.log("Initial session loaded");
            if (!session && currentSession) { // Only update if there's no existing session
              setSession(currentSession);
            }
            break;
            
          case 'PASSWORD_RECOVERY':
            console.log("Password recovery initiated");
            setSession(null);
            break;
        }
      });

      authSubscriptionRef.current = subscription;
    }

    // Cleanup function
    return () => {
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

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
