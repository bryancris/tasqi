
import React, { useState, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { useSignOut } from "../hooks";
import { useAuthRefs } from "./useAuthRefs";
import { useAuthTimeout } from "./useAuthTimeout";
import { useAuthInitialization } from "./useAuthInitialization";

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Get all the refs from the hook
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
  
  // Network status
  const { isOnline } = useNetworkDetection();

  // Use sign out hook
  const { handleSignOut } = useSignOut({
    mounted,
    setSession,
    setUser,
    setLoading,
    hasToastRef,
    authStateSubscription
  });

  // Use timeout management
  useAuthTimeout({
    loading,
    setLoading,
    setInitialized,
    mounted
  });

  // Handle auth initialization process
  useAuthInitialization({
    // Refs
    mounted,
    hasToastRef,
    authStateSubscription,
    authSetupAttempt,
    authSetupComplete,
    initializationCount,
    isDevMode,
    lastMountTimestamp,
    
    // State and state setters
    session,
    setSession,
    setUser,
    loading,
    setLoading,
    setInitialized,
    setAuthError,
    
    // Network status
    isOnline
  });

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
