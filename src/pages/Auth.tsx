
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useDevModeAuth } from "@/contexts/auth/hooks/useDevModeAuth";
import { isDevelopmentMode } from "@/contexts/auth/provider/constants";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const [authStuck, setAuthStuck] = useState(false);
  const { session, loading, initialized } = useAuth();
  const { enableDevBypass, forceAuthLoadingComplete } = useDevModeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the update password route
  const isUpdatePasswordRoute = location.pathname === "/auth/update-password";
  
  console.log("[Auth] Page state:", { 
    hasSession: !!session, 
    loading, 
    initialized,
    path: location.pathname
  });
  
  // Detect if auth is stuck in loading
  useEffect(() => {
    if (loading && !initialized) {
      const stuckTimeoutId = setTimeout(() => {
        if (loading && !initialized) {
          console.log("[Auth] Auth appears to be stuck in loading state");
          setAuthStuck(true);
        }
      }, 5000);
      
      return () => clearTimeout(stuckTimeoutId);
    }
  }, [loading, initialized]);
  
  // If we have a session and are initialized, redirect to dashboard
  useEffect(() => {
    if (session && initialized && !loading) {
      const from = location.state?.from || "/dashboard";
      console.log("[Auth] Session exists, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [session, loading, initialized, navigate, location.state]);

  // If still checking auth state, show loading indicator
  if (loading && !initialized) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Checking authentication status...</p>
          
          {authStuck && isDevelopmentMode() && (
            <div className="bg-white/10 p-4 rounded-md mt-4 max-w-md">
              <p className="text-white text-sm mb-3">Developer Tools: Authentication appears to be stuck</p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => {
                    enableDevBypass();
                    window.location.reload();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-blue-300 border-blue-500"
                >
                  Enable dev bypass
                </Button>
                
                <Button
                  onClick={forceAuthLoadingComplete}
                  variant="outline"
                  size="sm"
                  className="text-green-300 border-green-500"
                >
                  Force auth completion
                </Button>
                
                <Button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-300 border-red-500"
                >
                  Clear storage & reload
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (session) {
    const from = location.state?.from || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-white">
              {isUpdatePasswordRoute 
                ? "Update Your Password" 
                : showReset 
                  ? "Reset Password" 
                  : "Welcome to TASQI-AI"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isUpdatePasswordRoute ? (
              <div className="space-y-4">
                <ResetPasswordForm />
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white"
                  onClick={() => navigate("/auth", { replace: true })}
                >
                  Back to login
                </Button>
              </div>
            ) : showReset ? (
              <div className="space-y-4">
                <ResetPasswordForm />
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white"
                  onClick={() => setShowReset(false)}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signin">
                    <SignInForm onResetPassword={() => setShowReset(true)} />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignUpForm />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default Auth;
