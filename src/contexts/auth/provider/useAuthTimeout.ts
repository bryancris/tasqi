
import { useRef, useEffect } from "react";
import { AUTH_TIMEOUT_MS, DEV_MODE_TIMEOUT_ADDITION, isDevelopmentMode } from "./constants";

type AuthTimeoutProps = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  mounted: React.MutableRefObject<boolean>;
};

/**
 * Hook to handle auth initialization timeout
 */
export const useAuthTimeout = ({
  loading,
  setLoading,
  setInitialized,
  mounted
}: AuthTimeoutProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDevMode = useRef(isDevelopmentMode());

  useEffect(() => {
    // Force loading to false after a timeout (shorter in dev mode)
    const timeoutDuration = AUTH_TIMEOUT_MS + (isDevMode.current ? DEV_MODE_TIMEOUT_ADDITION : 0);
    
    console.log(`Setting auth timeout for ${timeoutDuration}ms`);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only set timeout if still loading
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        if (mounted.current && loading) {
          console.warn("Auth check timed out after " + timeoutDuration + "ms, forcing loading to false");
          setLoading(false);
          setInitialized(true);
        }
      }, timeoutDuration);
    }
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loading, mounted, setLoading, setInitialized]);

  return timeoutRef;
};
