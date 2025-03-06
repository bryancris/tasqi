
import { refreshAuth } from "../../authUtils";

/**
 * Hook to handle auth refresh logic
 */
export const useAuthRefresh = () => {
  /**
   * Refresh authentication state
   */
  const refreshAuthentication = (
    mounted: React.MutableRefObject<boolean>,
    setSession: (session: any) => void,
    setUser: (user: any) => void,
    setLoading: (loading: boolean) => void,
    hasToastRef: React.MutableRefObject<boolean>
  ) => {
    console.log("Network reconnected, refreshing auth");
    return refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
  };
  
  return {
    refreshAuthentication,
  };
};
