
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { useAuthSubscription, useSignOut, useNetworkAuth } from "./hooks";

// Maximum time to wait for auth to complete
const AUTH_TIMEOUT_MS = 3000; // Reduced from 5000
// Development mode timeout adjustment (shorter to improve dev experience)
const DEV_MODE_TIMEOUT_ADDITION = 1000; // Reduced from 2000

// Helper to detect development mode more reliably
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const authSetupAttempt = useRef(false);
  const authSetupComplete = useRef(false);
  const initializationCount = useRef(0);
  const isDevMode = useRef(isDevelopmentMode());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMountTimestamp = useRef(Date.now());
  
  // Network status
  const { isOnline } = useNetworkDetection();

  // Use the auth subscription hook with enhanced timeout for dev mode
  const { 
    setupAuthSubscription, 
    cleanupAuthSubscription,
    isInitialized,
    clearAuthState
  } = useAuthSubscription({
    mounted,
    setSession,
    setUser,
    setLoading,
    hasToastRef,
    setInitialized,
    setAuthError,
    isDevelopment: isDevMode.current
  });

  // Use sign out hook
  const { handleSignOut } = useSignOut({
    mounted,
    setSession,
    setUser,
    setLoading,
    hasToastRef,
    authStateSubscription
  });

  // Use network reconnection hook
  useNetworkAuth({
    isOnline,
    session,
    mounted,
    authInitialized: isInitialized,
    setSession,
    setUser,
    setLoading,
    hasToastRef
  });

  // Clear timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Perform initial auth check on mount - only once
  useEffect(() => {
    const currentMountTime = Date.now();
    const timeSinceLastMount = currentMountTime - lastMountTimestamp.current;
    lastMountTimestamp.current = currentMountTime;
    
    // Detect potential hot reload (very quick remount)
    const isProbableHotReload = isDevMode.current && timeSinceLastMount < 300;
    
    console.log("Auth provider initializing", 
                "Count:", initializationCount.current, 
                "Dev mode:", isDevMode.current,
                "Hot reload detected:", isProbableHotReload);
    
    // In development mode with hot reload, reset setup state
    if (isProbableHotReload && isDevMode.current) {
      console.log("Hot reload detected, resetting auth setup state");
      authSetupAttempt.current = false;
      authSetupComplete.current = false;
    }
    
    // Prevent duplicate initialization after component remounts
    if (authSetupComplete.current && !isProbableHotReload) {
      console.log("Auth provider already initialized, skipping");
      return;
    }
    
    // Track initialization attempts (useful for debugging)
    initializationCount.current += 1;
    
    // Set attempt flag to prevent duplicate setups
    if (authSetupAttempt.current) {
      console.log("Auth setup already attempted, waiting for completion");
      return;
    }
    
    authSetupAttempt.current = true;
    
    // Only proceed if we haven't fully completed setup
    if (!authSetupComplete.current) {
      authSetupComplete.current = true;
      
      // Setup auth subscription
      const subscription = setupAuthSubscription();
      if (subscription) {
        console.log("Auth subscription set up successfully");
        authStateSubscription.current = subscription;
      } else {
        console.warn("Auth subscription setup failed");
        // Force state to initialized after failure
        setLoading(false);
        setInitialized(true);
      }
      
      // Force loading to false after a timeout (shorter in dev mode)
      const timeoutDuration = AUTH_TIMEOUT_MS + (isDevMode.current ? DEV_MODE_TIMEOUT_ADDITION : 0);
      
      console.log(`Setting auth timeout for ${timeoutDuration}ms`);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (mounted.current && loading) {
          console.warn("Auth check timed out after " + timeoutDuration + "ms, forcing loading to false");
          setLoading(false);
          setInitialized(true);
        }
      }, timeoutDuration);
      
      // Cleanup function
      return () => {
        console.log("Auth provider unmounting, cleanup triggered");
        // Clear timeout to prevent memory leaks
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        mounted.current = false;
        
        // Only cleanup subscription if we're truly unmounting, not just in dev mode hot reload
        if (authStateSubscription.current) {
          cleanupAuthSubscription();
        }
      };
    }
  }, []); // Empty dependency array to ensure this only runs once

  // Create the context value with error handling
  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      error: authError,
      handleSignOut,
    }),
    [session, user, loading, initialized, authError, handleSignOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
