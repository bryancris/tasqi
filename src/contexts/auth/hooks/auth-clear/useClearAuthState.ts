
import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";

type ClearAuthStateProps = {
  mounted: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  hasToastRef: React.MutableRefObject<boolean>;
};

/**
 * Hook to handle clearing authentication state
 */
export const useClearAuthState = ({
  mounted,
  setSession,
  setUser,
  hasToastRef,
}: ClearAuthStateProps) => {
  // Helper to clear auth state
  const clearAuthState = useCallback(() => {
    if (mounted.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      hasToastRef.current = false;
    }
  }, [mounted, setSession, setUser, hasToastRef]);

  return { clearAuthState };
};
