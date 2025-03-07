
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useNetworkReconnection } from "./useNetworkReconnection";

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
  const { 
    canAttemptReconnection, 
    markReconnectionAttempt, 
    resetReconnectionAttempts 
  } = useNetworkReconnection();
  
  // Handle network reconnection
  useEffect(() => {
    // When connection is restored from an offline state
    if (isOnline && wasOffline.current && mounted.current && !recoveryInProgress.current) {
      // Check if we can attempt reconnection based on cooldown rules
      if (!canAttemptReconnection()) {
        console.log("Network reconnection throttled, skipping auth refresh");
        return;
      }
      
      console.log("Network reconnected, checking authentication state");
      recoveryInProgress.current = true;
      markReconnectionAttempt();
      
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
                resetReconnectionAttempts(); // Successfully reconnected
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
              resetReconnectionAttempts(); // Successfully reconnected
            }
          } else {
            // No existing session, check if there is one on the server
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log("Found session after network reconnection");
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              resetReconnectionAttempts(); // Successfully reconnected
              
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
  }, [
    isOnline, 
    session, 
    mounted, 
    setSession, 
    setUser, 
    setLoading, 
    hasToastRef, 
    authInitialized, 
    canAttemptReconnection, 
    markReconnectionAttempt, 
    resetReconnectionAttempts
  ]);
};
