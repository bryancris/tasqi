import React, { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuthRefs } from "./useAuthRefs";
import { useAuthSubscription, useNetworkAuth } from "../hooks";
import { useDevModeAuth } from "../hooks/useDevModeAuth";

// Detect if online for network status tracking
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? navigator.onLine 
      : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only create one instance at the module level
  // Track if we already have an instance
  const instanceRef = React.useRef<boolean>(false);
  
  useEffect(() => {
    if (instanceRef.current) {
      console.warn("[AuthProvider] Multiple instances detected - this should be a singleton");
    } else {
      instanceRef.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      instanceRef.current = false;
    };
  }, []);
  
  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Get online status
  const isOnline = useOnlineStatus();
  console.log("Network detection initialized, online:", isOnline);
  
  // Get refs
  const {
    mounted,
    hasToastRef,
    authStateSubscription,
    authSetupAttempt,
    authSetupComplete,
    initializationCount,
    isDevMode,
    lastMountTimestamp
  } = useAuthRefs();
  
  // Get dev mode helpers
  const { 
    isHotReload, 
    lastKnownAuthState,
    saveAuthState
  } = useDevModeAuth();
  
  // Use the auth subscription hook
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
  
  // Track session changes to save state in dev mode
  useEffect(() => {
    if (isDevMode.current && session) {
      saveAuthState(true);
    }
  }, [session, saveAuthState, isDevMode]);
  
  // Sign out handler
  const handleSignOut = async () => {
    try {
      console.log("[AuthProvider] Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[AuthProvider] Error signing out:", error);
        toast.error("Failed to sign out");
        return;
      }
      
      // Supabase auth listener will update state
      console.log("[AuthProvider] Sign out request successful");
    } catch (error) {
      console.error("[AuthProvider] Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Perform initial auth check on mount - only once
  useEffect(() => {
    const currentMountTime = Date.now();
    const timeSinceLastMount = currentMountTime - lastMountTimestamp.current;
    lastMountTimestamp.current = currentMountTime;
    
    // Detect potential hot reload (very quick remount)
    const isProbableHotReload = isDevMode.current && 
                              (isHotReload || timeSinceLastMount < 300);
    
    console.log("[AuthProvider] Initializing (SINGLE INSTANCE)", 
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
      console.log("[AuthProvider] Already initialized, skipping");
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
      
      // Cleanup function
      return () => {
        console.log("[AuthProvider] Cleaning up");
        
        mounted.current = false;
        
        // Only cleanup subscription if we're truly unmounting, not just in dev mode hot reload
        if (authStateSubscription.current && !isDevMode.current) {
          cleanupAuthSubscription();
          authStateSubscription.current = null;
        } else if (isDevMode.current) {
          console.log("Dev mode: Preserving auth subscription during hot reload");
        }
      };
    }
  }, []); // Empty dependency array to ensure this only runs once

  // Create context value - keep this at the end
  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      error: authError,
      handleSignOut,
    }),
    [session, user, loading, initialized, authError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
