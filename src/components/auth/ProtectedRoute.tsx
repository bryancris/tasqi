
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const authChecked = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip check if already authenticated
      if (session) {
        setIsChecking(false);
        authChecked.current = true;
        return;
      }

      // Skip recheck if already verified
      if (authChecked.current) {
        setIsChecking(false);
        return;
      }

      try {
        if (!loading) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error || !currentSession) {
            console.log("No session found, redirecting to auth");
            toast.error("Please sign in to access this page");
            navigate("/auth", { replace: true, state: { from: location.pathname } });
            return;
          }
          
          authChecked.current = true;
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error. Please try again.");
        navigate("/auth", { replace: true });
      }
    };

    checkAuth();
  }, [session, loading, navigate, location]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-[80%] max-w-[800px]">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return session ? <>{children}</> : null;
};
