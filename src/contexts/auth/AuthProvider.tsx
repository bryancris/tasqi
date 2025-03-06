
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { useAuthSubscription, useSignOut, useNetworkAuth } from "./hooks";

// Maximum time to wait for auth to complete
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Network status
  const { isOnline } = useNetworkDetection();

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
    hasToastRef
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

  // Perform initial auth check on mount
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Setup auth subscription
    const subscription = setupAuthSubscription();
    if (subscription) {
      authStateSubscription.current = subscription;
    }
    
    // Force loading to false after a timeout
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);
    
    // Cleanup function
    return () => {
      console.log("Auth provider unmounting");
      mounted.current = false;
      clearTimeout(timeoutId);
      
      // Cleanup auth subscription
      cleanupAuthSubscription();
    };
  }, [setupAuthSubscription, loading, cleanupAuthSubscription]);

  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      handleSignOut,
    }),
    [session, user, loading, handleSignOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
