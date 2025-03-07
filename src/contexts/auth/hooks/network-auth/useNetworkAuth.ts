
import { useEffect, useRef, useCallback } from "react";
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
 * with improved stability and throttling
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
  const lastIsOnlineState = useRef(isOnline);
  const reconnectionRequestId = useRef(0);
  const connectionStateChangeCount = useRef(0);
  
  // Get reconnection utilities from the enhanced hook
  const { 
    canAttemptReconnection, 
    markReconnectionAttempt, 
    markReconnectionComplete,
    recordNetworkState,
    isNetworkStable
  } = useNetworkReconnection();
  
  // Track a stable connection state, only calling the recovery
  // when we're reasonably certain connection is actually restored
  const checkAndUpdateConnectionState = useCallback((currentOnlineState: boolean) => {
    recordNetworkState(currentOnlineState);
    
    // Only process if there's an actual change in online status
    if (currentOnlineState === lastIsOnlineState.current) {
      return false;
    }
    
    // Update tracked state
    lastIsOnlineState.current = currentOnlineState;
    connectionStateChangeCount.current += 1;
    
    // If moving to offline state, just update the flag
    if (!currentOnlineState) {
      console.log("Network connection changed to offline");
      wasOffline.current = true;
      return false;
    }
    
    // If coming online and was offline before, handle it
    if (currentOnlineState && wasOffline.current) {
      // Don't trigger reconnection if network is unstable
      if (!isNetworkStable() && connectionStateChangeCount.current > 3) {
        console.log("Network appears unstable, delaying auth reconnection");
        return false;
      }
      
      console.log("Network reconnected from offline state");
      return true;
    }
    
    return false;
  }, [recordNetworkState, isNetworkStable]);
  
  // Recover session after reconnection
  const recoverSession = useCallback(async (requestId: number) => {
    if (!mounted.current || !isOnline) return false;
    
    try {
      console.log(`[${requestId}] Starting session recovery after reconnection`);
      
      // Skip if a recovery is already in progress
      if (recoveryInProgress.current) {
        console.log(`[${requestId}] Recovery already in progress, skipping`);
        return false;
      }
      
      setLoading(true);
      recoveryInProgress.current = true;
      let success = false;
      
      // If we already have a session, try refreshing it
      if (session) {
        console.log(`[${requestId}] Attempting to refresh existing session`);
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error(`[${requestId}] Failed to refresh session:`, error);
          
          // If refresh fails, try getting the session
          const { data: sessionData, error: getError } = await supabase.auth.getSession();
          
          if (getError) {
            console.error(`[${requestId}] Failed to get session:`, getError);
          }
          else if (sessionData?.session) {
            console.log(`[${requestId}] Retrieved session successfully after failed refresh`);
            if (mounted.current && requestId === reconnectionRequestId.current) {
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              success = true;
            }
          } else {
            console.log(`[${requestId}] No valid session found after reconnection`);
            if (mounted.current && requestId === reconnectionRequestId.current) {
              setSession(null);
              setUser(null);
              hasToastRef.current = false;
            }
          }
        } else if (data?.session) {
          console.log(`[${requestId}] Successfully refreshed session`);
          if (mounted.current && requestId === reconnectionRequestId.current) {
            setSession(data.session);
            setUser(data.session.user);
            success = true;
          }
        }
      } else {
        console.log(`[${requestId}] No existing session, checking for session on server`);
        // No existing session, check if there is one on the server
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error(`[${requestId}] Error getting session:`, error);
        }
        else if (sessionData?.session) {
          console.log(`[${requestId}] Found session after reconnection`);
          if (mounted.current && requestId === reconnectionRequestId.current) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            success = true;
            
            // Show toast only once for new session discovery
            if (!hasToastRef.current) {
              toast.success("Reconnected and restored session");
              hasToastRef.current = true;
            }
          }
        } else {
          console.log(`[${requestId}] No session found after reconnection`);
        }
      }
      
      return success;
    } catch (error) {
      console.error(`[${requestId}] Error recovering session:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      // Only clear flags if this is still the current request
      if (requestId === reconnectionRequestId.current) {
        // Reset the recovery flag to allow future recovery attempts
        recoveryInProgress.current = false;
        
        if (mounted.current) {
          setLoading(false);
          authInitialized.current = true;
        }
      } else {
        console.log(`[${requestId}] Recovery complete but superseded by newer request`);
      }
    }
  }, [session, mounted, setSession, setUser, setLoading, hasToastRef, authInitialized, isOnline]);
  
  // Handle network reconnection
  useEffect(() => {
    // Record the current network state for stability analysis
    recordNetworkState(isOnline);
    
    // Determine if this is a legitimate connection state change
    const shouldAttemptRecovery = checkAndUpdateConnectionState(isOnline);
    
    // Skip if not a valid recovery scenario
    if (!shouldAttemptRecovery || !mounted.current) {
      return;
    }
    
    console.log("Network reconnected, checking if auth recovery needed");
    
    // Check if we can attempt reconnection based on cooldown rules
    if (!canAttemptReconnection()) {
      console.log("Network reconnection throttled, skipping auth refresh");
      return;
    }
    
    // Mark the beginning of a reconnection attempt
    markReconnectionAttempt();
    
    // Create a unique ID for this reconnection request
    const requestId = Date.now();
    reconnectionRequestId.current = requestId;
    
    // Start the recovery process
    recoverSession(requestId).then(success => {
      // Mark completion
      markReconnectionComplete(success);
      
      // Reset the offline flag after successful reconnection processing
      if (success) {
        wasOffline.current = false;
      }
    });
    
  }, [
    isOnline, 
    session, 
    mounted, 
    recoverSession,
    canAttemptReconnection, 
    markReconnectionAttempt, 
    markReconnectionComplete,
    recordNetworkState,
    checkAndUpdateConnectionState
  ]);
  
  // Reset state if component unmounts
  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (recoveryInProgress.current) {
        console.log("Component unmounting, canceling any pending auth recovery");
        recoveryInProgress.current = false;
      }
    };
  }, []);
};
