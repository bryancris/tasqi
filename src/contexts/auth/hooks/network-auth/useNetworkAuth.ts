
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

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
 * Hook to handle authentication recovery when network connection is restored
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
  const wasOffline = useRef(false);
  const recoveryInProgress = useRef(false);
  
  // Handle network reconnection
  useEffect(() => {
    // When connection is restored
    if (isOnline && wasOffline.current && mounted.current && !recoveryInProgress.current) {
      console.log("Network reconnected, checking authentication state");
      recoveryInProgress.current = true;
      
      const recoverSession = async () => {
        try {
          console.log("Network auth: Checking session after reconnection");
          setLoading(true);
          
          // If we already have a session, try refreshing it
          if (session) {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
              console.error("Failed to refresh session after reconnection:", error);
              // If refresh fails, try getting the session
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log("Successfully retrieved session after network reconnection");
                setSession(sessionData.session);
                setUser(sessionData.session.user);
              } else {
                // No session found, clear state
                console.log("No session found after network reconnection");
                setSession(null);
                setUser(null);
                hasToastRef.current = false;
              }
            } else if (data?.session) {
              console.log("Successfully refreshed session after network reconnection");
              setSession(data.session);
              setUser(data.session.user);
            }
          } else {
            // No existing session, check if there is one on the server
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log("Found session after network reconnection");
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              
              // Show toast only once
              if (!hasToastRef.current) {
                toast.success("Reconnected and restored session");
                hasToastRef.current = true;
              }
            }
          }
        } catch (error) {
          console.error("Error recovering session after network reconnection:", error);
        } finally {
          if (mounted.current) {
            setLoading(false);
            recoveryInProgress.current = false;
            authInitialized.current = true;
          }
        }
      };
      
      recoverSession();
    }
    
    // Update offline status for next comparison
    wasOffline.current = !isOnline;
  }, [isOnline, session, mounted, setSession, setUser, setLoading, hasToastRef, authInitialized]);
};
