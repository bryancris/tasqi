
import { useRef, useEffect } from "react";
import { AUTH_TIMEOUT_MS, DEV_MODE_TIMEOUT_ADDITION, isDevelopmentMode } from "./constants";
import { useDevModeAuth } from "../hooks/useDevModeAuth";

type AuthTimeoutProps = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  mounted: React.MutableRefObject<boolean>;
};

/**
 * Hook to handle auth initialization timeout with enhanced dev mode support
 */
export const useAuthTimeout = ({
  loading,
  setLoading,
  setInitialized,
  mounted
}: AuthTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDevMode = useRef(isDevelopmentMode());
  const shortTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get dev mode helpers
  const { forceAuthInitialized, checkForceInitialized } = useDevModeAuth();

  useEffect(() => {
    // Force loading to false after a timeout (shorter in dev mode)
    const timeoutDuration = AUTH_TIMEOUT_MS + (isDevMode.current ? DEV_MODE_TIMEOUT_ADDITION : 0);
    
    // First check if we've already forced initialization in dev mode
    if (isDevMode.current && checkForceInitialized()) {
      console.log("Development mode: Found forced initialization flag, applying immediately");
      if (mounted.current && loading) {
        setLoading(false);
        setInitialized(true);
      }
      return;
    }
    
    console.log(`Setting auth timeout for ${timeoutDuration}ms`);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (shortTimeoutRef.current) {
      clearTimeout(shortTimeoutRef.current);
    }
    
    // Only set timeout if still loading
    if (loading) {
      // In development mode, add a shorter timeout as a first attempt
      if (isDevMode.current) {
        shortTimeoutRef.current = setTimeout(() => {
          if (mounted.current && loading) {
            console.log("Development mode: Short auth timeout reached (2000ms), checking for session");
            
            // Try to check for session in local storage before giving up
            const storedState = localStorage.getItem('dev_auth_state');
            if (storedState) {
              try {
                const parsedState = JSON.parse(storedState);
                if (parsedState && parsedState.hasSession && Date.now() - parsedState.timestamp < 30000) {
                  console.log("Development mode: Found recent session in storage, forcing completion");
                  setLoading(false);
                  setInitialized(true);
                  forceAuthInitialized();
                  return;
                }
              } catch (e) {
                console.warn("Failed to parse stored auth state", e);
              }
            }
          }
        }, 2000);
      }
      
      // Set main timeout
      timeoutRef.current = setTimeout(() => {
        if (mounted.current && loading) {
          console.warn("Auth check timed out after " + timeoutDuration + "ms, forcing loading to false");
          setLoading(false);
          setInitialized(true);
          
          // In development mode, set a flag to avoid the timeout on subsequent loads
          if (isDevMode.current) {
            forceAuthInitialized();
          }
        }
      }, timeoutDuration);
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (shortTimeoutRef.current) {
        clearTimeout(shortTimeoutRef.current);
        shortTimeoutRef.current = null;
      }
    };
  }, [loading, mounted, setLoading, setInitialized, forceAuthInitialized, checkForceInitialized]);

  return timeoutRef;
};
