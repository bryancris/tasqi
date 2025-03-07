
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  
  console.log("[ProtectedRoute] Status:", { 
    hasSession: !!session, 
    loading, 
    initialized, 
    redirectInProgress,
    path: location.pathname 
  });
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Only attempt redirection if everything is initialized and we're not already redirecting
    if (initialized && !loading && !redirectInProgress) {
      if (!session) {
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
  }, [session, loading, initialized, navigate, location.pathname, redirectInProgress]);

  // Show loading spinner while checking auth
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Verifying your account...</p>
        </div>
      </div>
    );
  }

  // If we have a session, render child routes
  if (session) {
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
