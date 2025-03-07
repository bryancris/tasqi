
import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { AuthChangeEvent } from "@supabase/supabase-js";

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
  
  // Process auth events
  const handleAuthEvent = useCallback((
    event: AuthChangeEvent,
    newSession: Session | null
  ) => {
    if (!mounted.current) {
      console.log("Component unmounted, ignoring auth state change");
      return;
    }
    
    console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
    
    // Handle different auth events
    switch (event) {
      case 'SIGNED_OUT':
        console.log("Signed out event received");
        clearAuthState();
        setLoading(false);
        if (setInitialized) setInitialized(true);
        break;
        
      case 'SIGNED_IN':
        if (newSession) {
          console.log("Signed in event received with session");
          updateAuthState(newSession);
        } else {
          console.warn("Signed in event received without session");
          setLoading(false);
          if (setInitialized) setInitialized(true);
        }
        break;
        
      case 'TOKEN_REFRESHED':
        if (newSession) {
          console.log('Token refreshed successfully');
          updateAuthState(newSession);
        } else {
          console.warn('Token refresh event without session');
          setLoading(false);
          if (setInitialized) setInitialized(true);
        }
        break;
        
      case 'USER_UPDATED':
        if (newSession) {
          console.log('User updated');
          updateAuthState(newSession);
        } else {
          console.warn('User updated event without session');
          setLoading(false);
          if (setInitialized) setInitialized(true);
        }
        break;
        
      case 'INITIAL_SESSION':
        console.log("Initial session check complete");
        if (newSession) {
          console.log("Initial session found");
          updateAuthState(newSession);
        } else {
          console.log("No initial session found");
          clearAuthState();
          setLoading(false);
          if (setInitialized) setInitialized(true);
        }
        break;
        
      default:
        console.log(`Unhandled auth event: ${event}`);
        // For unknown events, ensure we're not stuck loading
        setLoading(false);
        if (setInitialized) setInitialized(true);
    }
  }, [clearAuthState, mounted, setLoading, updateAuthState, setInitialized]);

  return { handleAuthEvent };
};
