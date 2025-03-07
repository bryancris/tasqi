
import React, { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuthRefs } from "./useAuthRefs";
import { useAuthSubscription } from "../hooks/auth-subscription";
import { useNetworkAuth } from "../hooks/network-auth";
import { useDevModeAuth } from "../hooks/useDevModeAuth";

// Create a static variable for tracking instances
const AUTH_PROVIDER_INSTANCES = { count: 0 };

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
  // Track instances to prevent multiple providers
  useEffect(() => {
    AUTH_PROVIDER_INSTANCES.count++;
    if (AUTH_PROVIDER_INSTANCES.count > 1) {
      console.warn("[AuthProvider] Multiple instances detected - this should be a singleton");
    }
    
    return () => {
      AUTH_PROVIDER_INSTANCES.count--;
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
  
  // Get refs
  const {
    mounted,
    hasToastRef,
    authStateSubscription,
    isDevMode
  } = useAuthRefs();
  
  // Get dev mode helpers
  const { isDevBypassEnabled, lastKnownAuthState } = useDevModeAuth();
  
  // Fast path for dev mode bypass
  useEffect(() => {
    if (isDevMode.current && isDevBypassEnabled() && loading) {
      console.log("Development mode: Auth bypass enabled, skipping normal initialization");
      if (mounted.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [isDevMode, loading, mounted]);
  
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
      
      // Clear state immediately to prevent flashes of authenticated content
      clearAuthState();
      console.log("[AuthProvider] Sign out successful");
    } catch (error) {
      console.error("[AuthProvider] Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Perform initial auth setup - only once
  useEffect(() => {
    console.log("[AuthProvider] Initializing auth provider");
    
    // Skip if using dev bypass
    if (isDevMode.current && isDevBypassEnabled()) {
      console.log("Development mode: Auth bypass enabled, skipping normal setup");
      setLoading(false);
      setInitialized(true);
      return;
    }
    
    // Setup auth subscription and store it
    const subscription = setupAuthSubscription();
    if (subscription) {
      authStateSubscription.current = subscription;
    }
    
    // Cleanup on unmount
    return () => {
      console.log("[AuthProvider] Cleaning up auth provider");
      mounted.current = false;
      
      // Clean up auth subscription
      cleanupAuthSubscription();
    };
  }, []); // Empty dependency array to ensure this only runs once

  // Create context value
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
