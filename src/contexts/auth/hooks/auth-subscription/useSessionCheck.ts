
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { isDevelopmentMode, getDevAuthState } from "../../provider/constants";

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
    // For dev mode, first check if we have a cached session state for fast loading
    if (isDevelopment) {
      const lastState = getDevAuthState();
      if (lastState && lastState.hasSession) {
        console.log("Development mode: Using cached session state for faster loading");
        // Just mark as initialized, the actual session will be fetched in the background
        if (mounted.current) {
          setLoading(false);
          if (setInitialized) setInitialized(true);
        }
      }
    }
  
    try {
      console.log("Checking for existing session...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error retrieving session:", error);
        if (setAuthError) setAuthError(error);
        
        // In development, don't get stuck in loading
        if (isDevelopment) {
          setTimeout(() => {
            if (mounted.current) {
              console.log("Dev mode: Error checking session, forcing completion");
              clearAuthState();
              setLoading(false);
              if (setInitialized) setInitialized(true);
            }
          }, 800);
        }
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
              console.log("Dev mode: No session found, forcing completion");
              clearAuthState();
              setLoading(false);
              if (setInitialized) setInitialized(true);
            }
          }, 800);
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
      if (setAuthError && err instanceof Error) setAuthError(err);
      
      // In development mode, make sure we don't get stuck
      if (isDevelopment) {
        setTimeout(() => {
          if (mounted.current) {
            console.log("Dev mode: Error during session check, forcing completion");
            clearAuthState();
            setLoading(false);
            if (setInitialized) setInitialized(true);
          }
        }, 1000);
      }
    }
  }, [updateAuthState, clearAuthState, setLoading, setInitialized, setAuthError, mounted, isDevelopment]);

  return { checkExistingSession };
};
