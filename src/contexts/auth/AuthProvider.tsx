
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { useAuthSubscription, useSignOut, useNetworkAuth } from "./hooks";

// Maximum time to wait for auth to complete
const AUTH_TIMEOUT_MS = 5000;
// Development mode timeout adjustment (longer to handle dev mode issues)
const DEV_MODE_TIMEOUT_ADDITION = 2000;

// Helper to detect development mode
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const authSetupComplete = useRef(false);
  const initializationCount = useRef(0);
  const isDevMode = useRef(isDevelopmentMode());
  
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

  // Perform initial auth check on mount - only once
  useEffect(() => {
    console.log("Auth provider initializing", 
                "Count:", initializationCount.current, 
                "Dev mode:", isDevMode.current);
    
    // Prevent duplicate initialization after component remounts
    if (authSetupComplete.current) {
      console.log("Auth provider already initialized, skipping");
      return;
    }
    
    // Track initialization attempts (useful for debugging)
    initializationCount.current += 1;
    
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
      }
      
      // Force loading to false after a timeout (longer in dev mode)
      const timeoutDuration = AUTH_TIMEOUT_MS + (isDevMode.current ? DEV_MODE_TIMEOUT_ADDITION : 0);
      
      console.log(`Setting auth timeout for ${timeoutDuration}ms`);
      const timeoutId = setTimeout(() => {
        if (mounted.current && loading) {
          console.warn("Auth check timed out after " + timeoutDuration + "ms, forcing loading to false");
          setLoading(false);
          setInitialized(true);
        }
      }, timeoutDuration);
      
      // Cleanup function
      return () => {
        console.log("Auth provider unmounting, cleanup triggered");
        clearTimeout(timeoutId);
        mounted.current = false;
        
        // Only cleanup subscription if we're truly unmounting, not just in dev mode hot reload
        if (authStateSubscription.current) {
          cleanupAuthSubscription();
        }
      };
    }
  }, []); // Empty dependency array to ensure this only runs once

  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      handleSignOut,
    }),
    [session, user, loading, initialized, handleSignOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
