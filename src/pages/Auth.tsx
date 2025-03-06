
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

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the update password route
  const isUpdatePasswordRoute = location.pathname === "/auth/update-password";
  
  // Only redirect when we have a confirmed session and loading is complete
  useEffect(() => {
    if (session && !loading) {
      console.log("Auth page: Session exists, redirecting to dashboard");
      // Use a slight delay to allow state to settle
      const redirectTimer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [session, loading, navigate]);
  
  // Dedicated loading component for cleaner rendering
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If we have a confirmed session, show a redirect message
  if (session) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Redirecting to dashboard...</p>
        </div>
      </div>
    );
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
