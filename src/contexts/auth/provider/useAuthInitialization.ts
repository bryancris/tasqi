
import { useEffect } from "react";
import { useAuthSubscription, useNetworkAuth } from "../hooks";
import { useDevModeAuth } from "../hooks/useDevModeAuth";

type AuthInitializationProps = {
  // Refs
  mounted: React.MutableRefObject<boolean>;
  hasToastRef: React.MutableRefObject<boolean>;
  authStateSubscription: React.MutableRefObject<{ unsubscribe: () => void } | null>;
  authSetupAttempt: React.MutableRefObject<boolean>;
  authSetupComplete: React.MutableRefObject<boolean>;
  initializationCount: React.MutableRefObject<number>;
  isDevMode: React.MutableRefObject<boolean>;
  lastMountTimestamp: React.MutableRefObject<number>;
  
  // State and state setters
  session: any;
  setSession: (session: any) => void;
  setUser: (user: any) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setAuthError: (error: Error | null) => void;
  
  // Network state
  isOnline: boolean;
};

/**
 * Enhanced hook to handle auth initialization process with better dev mode support
 */
export const useAuthInitialization = ({
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
  
  // Network state
  isOnline
}: AuthInitializationProps) => {
  // Get dev mode helpers
  const { 
    isHotReload, 
    lastKnownAuthState,
    saveAuthState,
    checkForceInitialized
  } = useDevModeAuth();
  
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

  // Perform initial auth check on mount - only once
  useEffect(() => {
    const currentMountTime = Date.now();
    const timeSinceLastMount = currentMountTime - lastMountTimestamp.current;
    lastMountTimestamp.current = currentMountTime;
    
    // Detect potential hot reload (very quick remount)
    const isProbableHotReload = isDevMode.current && 
                              (isHotReload || timeSinceLastMount < 300);
    
    console.log("Auth provider initializing", 
                "Count:", initializationCount.current, 
                "Dev mode:", isDevMode.current,
                "Hot reload detected:", isProbableHotReload);
    
    // Check if forced initialization is set in dev mode
    if (isDevMode.current && checkForceInitialized()) {
      console.log("Development mode: Found forced initialization flag, skipping normal flow");
      
      // If we have a last known state with a session, restore it
      if (lastKnownAuthState?.current?.hasSession && !session) {
        console.log("Development mode: Using last known auth state");
        
        // Attempt to check for existing session, but don't wait for it
        const quickSessionCheck = async () => {
          try {
            const { data } = await fetch(
              'https://mcwlzrikidzgxexnccju.functions.supabase.co/health-check',
              { method: 'GET' }
            ).then(res => res.json());
            
            if (data?.healthy) {
              console.log("Development mode: Backend is healthy, proceeding with normal auth");
              setupAuthSubscription();
            } else {
              console.log("Development mode: Backend health check failed, forcing initialized state");
              if (mounted.current) {
                setLoading(false);
                setInitialized(true);
              }
            }
          } catch (e) {
            console.warn("Development mode: Health check failed, forcing initialized state");
            if (mounted.current) {
              setLoading(false);
              setInitialized(true);
            }
          }
        };
        
        quickSessionCheck();
      } else {
        // Just force loading to complete
        if (mounted.current && loading) {
          setLoading(false);
          setInitialized(true);
        }
      }
      return;
    }
    
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
      
      // Cleanup function
      return () => {
        console.log("Auth provider unmounting, cleanup triggered");
        
        mounted.current = false;
        
        // Only cleanup subscription if we're truly unmounting, not just in dev mode hot reload
        if (authStateSubscription.current && !isDevMode.current) {
          cleanupAuthSubscription();
        } else if (isDevMode.current) {
          console.log("Dev mode: Preserving auth subscription during hot reload");
        }
      };
    }
  }, []); // Empty dependency array to ensure this only runs once
};
