
import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";

type AuthEventHandlerProps = {
  updateAuthState: (session: Session | null) => void;
  clearAuthState: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized?: (initialized: boolean) => void;
  mounted: React.MutableRefObject<boolean>;
};

/**
 * Hook to handle auth state change events
 */
export const useAuthEventHandler = ({
  updateAuthState,
  clearAuthState,
  setLoading,
  setInitialized,
  mounted
}: AuthEventHandlerProps) => {
  
  const handleAuthEvent = useCallback((event: string, newSession: Session | null) => {
    console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
    
    if (!mounted.current) {
      console.log("Component unmounted, ignoring auth state change");
      return;
    }
    
    if (event === 'SIGNED_OUT') {
      clearAuthState();
      console.log("Signed out, auth state cleared");
      setLoading(false);
      if (setInitialized) setInitialized(true);
    } 
    else if (event === 'SIGNED_IN' && newSession) {
      console.log("Signed in event received with session");
      updateAuthState(newSession);
    } 
    else if (event === 'TOKEN_REFRESHED' && newSession) {
      console.log('Token refreshed successfully');
      updateAuthState(newSession);
    } 
    else if (event === 'USER_UPDATED' && newSession) {
      console.log('User updated');
      updateAuthState(newSession);
    }
    else if (event === 'INITIAL_SESSION') {
      console.log("Initial session check complete");
      // Handle initial session check
      if (newSession) {
        console.log("Initial session found");
        updateAuthState(newSession);
      } else {
        console.log("No initial session found");
        clearAuthState();
        setLoading(false);
        if (setInitialized) setInitialized(true);
      }
    }
  }, [updateAuthState, clearAuthState, setLoading, setInitialized, mounted]);

  return { handleAuthEvent };
};
