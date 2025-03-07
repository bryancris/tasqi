import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  
  useEffect(() => {
    const authSuccess = window.localStorage.getItem('auth_success');
    
    if (!session && initialized && !loading && !isCheckingSession && authSuccess === 'true') {
      console.log("ProtectedRoute: Auth success flag found but no session in context, performing final check");
      setIsCheckingSession(true);
      
      const finalSessionCheck = async () => {
        try {
          const refreshResult = await supabase.auth.refreshSession();
          const { data } = await supabase.auth.getSession();
          
          if (refreshResult.data.session || data.session) {
            console.log("ProtectedRoute: Found session after final check");
            setTimeout(() => {
              setIsCheckingSession(false);
            }, 500);
            return;
          }
          
          console.log("ProtectedRoute: No session found after final check");
          window.localStorage.removeItem('auth_success');
          navigate("/auth", { 
            replace: true,
            state: { from: location.pathname } 
          });
        } catch (error) {
          console.error("Error in final session check:", error);
          window.localStorage.removeItem('auth_success');
          navigate("/auth", { 
            replace: true,
            state: { from: location.pathname } 
          });
        } finally {
          setIsCheckingSession(false);
        }
      };
      
      finalSessionCheck();
    }
  }, [session, loading, initialized, navigate, location.pathname, isCheckingSession]);
  
  useEffect(() => {
    if (!loading && !isCheckingSession && initialized && !session) {
      console.log("ProtectedRoute: No session found, redirecting to auth");
      navigate("/auth", { 
        replace: true,
        state: { from: location.pathname } 
      });
    }
  }, [session, loading, initialized, navigate, location.pathname, isCheckingSession]);

  if (loading || isCheckingSession || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return <Outlet />;
  }

  return null;
};
