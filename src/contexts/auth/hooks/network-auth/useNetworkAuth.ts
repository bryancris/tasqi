
import { useEffect, useRef } from 'react';
import { useNetworkReconnection } from './useNetworkReconnection';
import { refreshAuth } from '@/contexts/auth/authUtils';
import { Session, User } from '@supabase/supabase-js';

/**
 * Hook that refreshes auth state when network reconnects
 */
export const useNetworkAuth = (
  mounted: React.MutableRefObject<boolean>,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  hasToastRef: React.MutableRefObject<boolean>
) => {
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  
  // Minimum time between refresh operations (15 seconds)
  const MIN_REFRESH_INTERVAL_MS = 15000;
  
  const handleNetworkReconnection = () => {
    const now = Date.now();
    
    // Prevent concurrent refresh operations
    if (isRefreshingRef.current) {
      console.log('Auth refresh already in progress, skipping');
      return;
    }
    
    // Enforce minimum time between refreshes
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL_MS) {
      console.log('Auth refresh attempted too soon, throttling');
      return;
    }
    
    // Update timestamps and set flag
    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;
    
    // Perform the refresh
    refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef)
      .finally(() => {
        // Clear the flag when done
        isRefreshingRef.current = false;
      });
  };
  
  // Use the reconnection hook to trigger auth refresh
  const { isOnline, isNetworkAvailable } = useNetworkReconnection(handleNetworkReconnection);
  
  // Handle component unmounting
  useEffect(() => {
    return () => {
      isRefreshingRef.current = false;
    };
  }, []);
  
  return {
    isOnline,
    isNetworkAvailable
  };
};
