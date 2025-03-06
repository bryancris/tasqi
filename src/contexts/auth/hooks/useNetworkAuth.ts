
import { useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { refreshAuth } from "../authUtils";

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
  // Track last reconnection attempt
  const lastReconnectionAttempt = useRef(0);
  const MIN_RECONNECTION_INTERVAL_MS = 5000; // 5 seconds minimum between attempts

  // Handle network reconnection - refresh auth if needed
  useEffect(() => {
    const now = Date.now();
    
    if (isOnline && !session && authInitialized.current && 
        (now - lastReconnectionAttempt.current > MIN_RECONNECTION_INTERVAL_MS)) {
      console.log("Network reconnected, refreshing auth");
      lastReconnectionAttempt.current = now;
      refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
    }
  }, [isOnline, session, authInitialized, mounted, setSession, setUser, setLoading, hasToastRef]);
};
