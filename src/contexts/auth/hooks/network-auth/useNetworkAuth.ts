
import { useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type NetworkAuthProps = {
  isOnline: boolean;
  session: Session | null;
  mounted: React.MutableRefObject<boolean>;
  authInitialized: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
};

/**
 * Hook to handle authentication reconnection on network changes
 */
export const useNetworkAuth = ({
  isOnline,
  session,
  mounted,
  authInitialized,
  setSession,
  setUser,
  setLoading,
  hasToastRef
}: NetworkAuthProps) => {
  // Handle network reconnection
  useEffect(() => {
    // Skip if not fully initialized or unmounted
    if (!mounted.current || !authInitialized.current) return;
    
    // When network reconnects
    if (isOnline) {
      let isCancelled = false;
      
      // Check auth state on reconnect
      const checkAuthOnReconnect = async () => {
        // Only proceed if we're online and had a session before
        if (!isOnline || !session) return;
        
        console.log("Network reconnected, checking session validity");
        
        try {
          setLoading(true);
          
          // Get current session
          const { data, error } = await supabase.auth.getSession();
          
          if (isCancelled) return;
          
          if (error) {
            console.error("Error refreshing session on reconnect:", error);
            return;
          }
          
          // Update session if it exists
          if (data?.session) {
            console.log("Reconnected with valid session");
            setSession(data.session);
            setUser(data.session.user);
          } else {
            console.log("Reconnected but no valid session found");
            setSession(null);
            setUser(null);
            hasToastRef.current = false;
          }
        } catch (err) {
          console.error("Error during network reconnection auth check:", err);
        } finally {
          if (!isCancelled && mounted.current) {
            setLoading(false);
          }
        }
      };
      
      // Check auth state with a small delay to allow network to stabilize
      const timeoutId = setTimeout(checkAuthOnReconnect, 1000);
      
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    }
  }, [isOnline, session, mounted, authInitialized, setSession, setUser, setLoading, hasToastRef]);
};
