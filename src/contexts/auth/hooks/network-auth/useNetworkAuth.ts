
import { useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { useNetworkReconnection } from "./useNetworkReconnection";
import { useAuthRefresh } from "./useAuthRefresh";

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
 * Hook to handle authentication refresh on network reconnection
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
  const { canAttemptReconnection, markReconnectionAttempt } = useNetworkReconnection();
  const { refreshAuthentication } = useAuthRefresh();

  // Handle network reconnection - refresh auth if needed
  useEffect(() => {
    // Only attempt refresh if:
    // 1. We're now online
    // 2. There's no active session
    // 3. Auth is already initialized
    // 4. Enough time has passed since last attempt
    if (isOnline && !session && authInitialized.current && canAttemptReconnection()) {
      markReconnectionAttempt();
      refreshAuthentication(mounted, setSession, setUser, setLoading, hasToastRef);
    }
  }, [
    isOnline, 
    session, 
    authInitialized, 
    mounted, 
    setSession, 
    setUser, 
    setLoading, 
    hasToastRef
  ]);
};
