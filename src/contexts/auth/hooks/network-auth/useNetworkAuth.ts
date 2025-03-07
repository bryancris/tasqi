
import { useEffect, useRef } from 'react';
import { useNetworkReconnection } from './useNetworkReconnection';
import { refreshAuth } from '@/contexts/auth/authUtils';
import { Session, User } from '@supabase/supabase-js';

/**
 * Hook that refreshes auth state when network reconnects
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
}: {
  isOnline: boolean;
  session: Session | null;
  mounted: React.MutableRefObject<boolean>;
  authInitialized: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
}) => {
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const lastOnlineStateRef = useRef(isOnline);
  
  // Minimum time between refresh operations (15 seconds)
  const MIN_REFRESH_INTERVAL_MS = 15000;
  
  const handleNetworkReconnection = () => {
    // Only trigger a refresh if we're transitioning from offline to online
    if (!lastOnlineStateRef.current && isOnline) {
      console.log('Network reconnected, considering auth refresh');
      
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
      
      // Only refresh if we have a session or auth is initialized
      if (session || authInitialized.current) {
        console.log('Starting auth refresh after network reconnection');
        
        // Update timestamps and set flag
        isRefreshingRef.current = true;
        lastRefreshTimeRef.current = now;
        
        // Perform the refresh
        refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef)
          .finally(() => {
            // Clear the flag when done
            isRefreshingRef.current = false;
          });
      } else {
        console.log('No session or auth not initialized, skipping refresh');
      }
    }
    
    // Update last known online state
    lastOnlineStateRef.current = isOnline;
  };
  
  // Use the network reconnection hook
  const { isNetworkAvailable } = useNetworkReconnection(handleNetworkReconnection);
  
  // Track online state changes
  useEffect(() => {
    handleNetworkReconnection();
  }, [isOnline]);
  
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
