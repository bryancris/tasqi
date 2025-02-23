
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        console.log("No session found, redirecting to auth");
        toast.error("Please sign in to access this page");
        navigate("/auth", { 
          replace: true, 
          state: { from: location.pathname } 
        });
      }
      setIsChecking(false);
    }
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
