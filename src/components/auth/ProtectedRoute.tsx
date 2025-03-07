
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { isDevelopmentMode } from "@/contexts/auth/provider/constants";
import { useDevModeAuth } from "@/contexts/auth/hooks/useDevModeAuth";
import { Button } from "@/components/ui/button";

// Maximum wait time before forcing redirect
const MAX_WAIT_TIME = isDevelopmentMode() ? 5000 : 3000;

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const { 
    isDevBypassEnabled, 
    enableDevBypass, 
    shouldSkipAuthTimeout,
    forceAuthLoadingComplete 
  } = useDevModeAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [stuckInLoading, setStuckInLoading] = useState(false);
  
  // Check if dev mode auth bypass is enabled
  const isAuthBypassed = isDevBypassEnabled();
  
  // Log auth state for debugging
  useEffect(() => {
    if (isDevelopmentMode()) {
      console.log("[ProtectedRoute] Auth state:", { 
        session: !!session, 
        loading, 
        initialized, 
        isAuthBypassed, 
        redirectInProgress,
        stuckInLoading,
        waitingTooLong
      });
    }
  }, [session, loading, initialized, isAuthBypassed, redirectInProgress, stuckInLoading, waitingTooLong]);
  
  // In dev mode with bypass enabled, render children immediately
  if (isDevelopmentMode() && isAuthBypassed) {
    console.log("[ProtectedRoute] Dev mode with auth bypass enabled, skipping protection");
    // Auto-enable the bypass for future page loads in this session
    if (sessionStorage.getItem('dev_bypass_auth') !== 'true') {
      sessionStorage.setItem('dev_bypass_auth', 'true');
      console.log("[ProtectedRoute] Enabled auth bypass for this session");
    }
    return <Outlet />;
  }
  
  // Check if we've been waiting for too long
  useEffect(() => {
    if (loading && !initialized && !waitingTooLong) {
      const timeoutId = setTimeout(() => {
        setWaitingTooLong(true);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, initialized, waitingTooLong]);
  
  // Detect if we're potentially stuck in loading
  useEffect(() => {
    // Skip the stuck detection if we're using the auth timeout skip in dev mode
    if (shouldSkipAuthTimeout()) return;
    
    if (loading && !initialized && !stuckInLoading) {
      const stuckTimeoutId = setTimeout(() => {
        if (loading && !initialized) {
          console.log("[ProtectedRoute] Auth appears to be stuck in loading state");
          setStuckInLoading(true);
        }
      }, 8000); // Much longer timeout to detect truly stuck states
      
      return () => clearTimeout(stuckTimeoutId);
    }
  }, [loading, initialized, stuckInLoading, shouldSkipAuthTimeout]);
  
  // Effect to handle the actual redirection
  useEffect(() => {
    // If already redirecting, do nothing
    if (redirectInProgress) return;
    
    // Skip redirect timeout in dev mode if configured
    if (shouldSkipAuthTimeout()) {
      console.log("[ProtectedRoute] Auth timeout check disabled in dev mode");
      return;
    }
    
    // Wait for auth to be initialized or loading to complete
    if (loading && !initialized) {
      // After maximum wait time, redirect to auth
      const timeoutId = setTimeout(() => {
        console.log("[ProtectedRoute] Auth timed out after maximum wait time, redirecting to auth");
        setRedirectInProgress(true);
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }, MAX_WAIT_TIME);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Auth is initialized, check session
    if (!loading || initialized) {
      if (session) {
        // Has session, render normally (no redirect needed)
        console.log("[ProtectedRoute] Session found, allowing access");
        return;
      } else {
        // No session, redirect to auth
        console.log("[ProtectedRoute] No session found, redirecting to auth");
        setRedirectInProgress(true);
        
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    }
  }, [session, loading, initialized, navigate, location.pathname, redirectInProgress, shouldSkipAuthTimeout]);

  // Show loading spinner while checking auth
  if ((loading && !initialized) || (!session && !redirectInProgress)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">
            {waitingTooLong 
              ? "Still verifying your account... taking longer than usual" 
              : "Verifying your account..."}
          </p>
          
          {(waitingTooLong || stuckInLoading) && (
            <div className="text-xs text-slate-500 max-w-md text-center mt-2">
              <p className="mb-1">If this persists, try refreshing the page or clearing your browser storage.</p>
              {isDevelopmentMode() && (
                <div className="flex flex-col gap-2 mt-3">
                  <Button 
                    onClick={() => {
                      enableDevBypass();
                      window.location.reload();
                    }}
                    variant="outline"
                    size="sm"
                    className="text-blue-500 border-blue-500"
                  >
                    Enable dev bypass and reload
                  </Button>
                  
                  <Button
                    onClick={forceAuthLoadingComplete}
                    variant="outline"
                    size="sm"
                    className="text-green-500 border-green-500"
                  >
                    Force auth loading completion
                  </Button>
                  
                  <Button
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500"
                  >
                    Clear all storage and reload
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If we have a session, render child routes
  if (session) {
    return <Outlet />;
  }

  // Fallback while redirecting
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    </div>
  );
};
