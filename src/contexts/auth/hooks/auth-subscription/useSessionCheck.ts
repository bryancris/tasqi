
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

type SessionCheckProps = {
  updateAuthState: (session: Session | null) => void;
  clearAuthState: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized?: (initialized: boolean) => void;
  setAuthError?: (error: Error | null) => void;
  mounted: React.MutableRefObject<boolean>;
  isDevelopment?: boolean;
};

/**
 * Hook for checking the current session
 */
export const useSessionCheck = ({
  updateAuthState,
  clearAuthState,
  setLoading,
  setInitialized,
  setAuthError,
  mounted,
  isDevelopment = false
}: SessionCheckProps) => {
  
  const checkExistingSession = useCallback(async () => {
    try {
      console.log("Checking for existing session...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error retrieving session:", error);
        if (setAuthError) setAuthError(error);
        return;
      }
      
      if (data?.session) {
        console.log("Found existing session during initialization");
        updateAuthState(data.session);
      } else {
        console.log("No existing session found during initialization");
        // In development, set loading to false after a short delay to prevent flicker
        if (isDevelopment) {
          setTimeout(() => {
            if (mounted.current) {
              console.log("Dev mode: Forcing initialization state after check");
              clearAuthState();
              setLoading(false);
              if (setInitialized) setInitialized(true);
            }
          }, 800); // Reduced from 1000ms
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
      if (setAuthError && err instanceof Error) setAuthError(err);
    }
  }, [updateAuthState, clearAuthState, setLoading, setInitialized, setAuthError, mounted, isDevelopment]);

  return { checkExistingSession };
};
