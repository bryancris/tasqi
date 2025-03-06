
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

type SignOutProps = {
  mounted: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
  authStateSubscription: React.MutableRefObject<{ unsubscribe: () => void } | null>;
};

export const useSignOut = ({
  mounted,
  setSession,
  setUser,
  setLoading,
  hasToastRef,
  authStateSubscription
}: SignOutProps) => {
  const refreshAttemptCount = useRef(0);

  // Helper to clear auth state
  const clearAuthState = useCallback(() => {
    if (mounted.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      hasToastRef.current = false;
      refreshAttemptCount.current = 0;
    }
  }, [mounted, setSession, setUser, hasToastRef]);

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
      // Unsubscribe from auth state first to prevent extra callbacks during signout
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear auth state
      clearAuthState();
      
      console.log("Sign out complete");
      
      // Show success toast
      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [authStateSubscription, clearAuthState, mounted, setLoading]);

  return { handleSignOut };
};
