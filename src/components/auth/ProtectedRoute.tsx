
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = () => {
      if (!loading && !session && mounted && location.pathname !== '/auth') {
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-[80%] max-w-[800px]">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};
