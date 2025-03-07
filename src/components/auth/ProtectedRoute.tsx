
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";

const MAX_WAIT_TIME = 5000; // 5 seconds max to wait for auth

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [manualCheckInProgress, setManualCheckInProgress] = useState(false);
  const [manualSessionCheck, setManualSessionCheck] = useState<boolean | null>(null);
  
  // Log current status for debugging
  console.log("[ProtectedRoute] Status:", { 
    hasSession: !!session, 
    loading, 
    initialized,
    redirectInProgress,
    manualCheckInProgress,
    manualSessionFound: manualSessionCheck,
    path: location.pathname 
  });
  
  // Function to manually check for session if auth is taking too long
  const performManualSessionCheck = useCallback(async () => {
    if (manualCheckInProgress) return;
    
    try {
      console.log("[ProtectedRoute] Performing manual session check");
      setManualCheckInProgress(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[ProtectedRoute] Manual session check error:", error);
        setManualSessionCheck(false);
      } else if (data?.session) {
        console.log("[ProtectedRoute] Manual check found valid session");
        setManualSessionCheck(true);
      } else {
        console.log("[ProtectedRoute] Manual check found no session");
        setManualSessionCheck(false);
      }
    } catch (e) {
      console.error("[ProtectedRoute] Error in manual session check:", e);
      setManualSessionCheck(false);
    } finally {
      setManualCheckInProgress(false);
    }
  }, [manualCheckInProgress]);
  
  // If auth is taking too long, perform a manual check
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading && !initialized && manualSessionCheck === null && !manualCheckInProgress) {
      console.log("[ProtectedRoute] Auth taking too long, performing manual check");
      timeoutId = setTimeout(() => {
        performManualSessionCheck();
      }, 2000); // Wait 2 seconds before manual check
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, initialized, manualSessionCheck, manualCheckInProgress, performManualSessionCheck]);
  
  // Effect to handle the actual redirection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // 1. When everything is initialized and we know the auth state
    const canProceed = initialized && !loading;
    
    // 2. Special case: if auth is still initializing but taking too long
    // AND manual check completed successfully with a session
    const slowInitWithSession = !initialized && loading && manualSessionCheck === true;
    
    // 3. Special case: if auth is still initializing but taking too long
    // AND manual check completed and found no session
    const slowInitNoSession = !initialized && loading && manualSessionCheck === false;
    
    // 4. Timeout case: if auth is taking too long and we haven't completed manual check
    const authTimeout = !initialized && loading && 
                     !manualCheckInProgress && 
                     manualSessionCheck === null;
    
    // Wait for max time if auth is still in progress
    if (authTimeout) {
      const maxTimeoutId = setTimeout(() => {
        console.log("[ProtectedRoute] Auth timed out after maximum wait time, redirecting to auth");
        if (!redirectInProgress) {
          setRedirectInProgress(true);
          navigate("/auth", { 
            replace: true,
            state: { from: location.pathname } 
          });
        }
      }, MAX_WAIT_TIME);
      
      return () => {
        clearTimeout(maxTimeoutId);
      };
    }
    
    // If we can proceed normally or have a forced path decision:
    if ((canProceed || slowInitWithSession || slowInitNoSession) && !redirectInProgress) {
      
      // Session exists: render protected content
      if (session || slowInitWithSession) {
        // Just let it render the outlet
        return;
      } 
      
      // No session: redirect to auth
      if (!session || slowInitNoSession) {
        console.log("[ProtectedRoute] No session found, redirecting to auth");
        setRedirectInProgress(true);
        
        // Small timeout to prevent rapid navigation during state changes
        timeoutId = setTimeout(() => {
          navigate("/auth", { 
            replace: true,
            state: { from: location.pathname } 
          });
        }, 100);
      }
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    session, 
    loading, 
    initialized, 
    navigate, 
    location.pathname, 
    redirectInProgress,
    manualCheckInProgress,
    manualSessionCheck
  ]);

  // Show loading spinner while checking auth
  if ((loading || !initialized) && !manualSessionCheck) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Verifying your account...</p>
        </div>
      </div>
    );
  }

  // If we have a session or manual check found one, render child routes
  if (session || manualSessionCheck === true) {
    return <Outlet />;
  }

  // Fallback while redirecting
  if (redirectInProgress) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // Shouldn't reach here, but just in case
  return null;
};
