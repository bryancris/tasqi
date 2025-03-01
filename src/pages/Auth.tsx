
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const { session, loading } = useAuth();
  const [initialRender, setInitialRender] = useState(true);
  
  // Effect to handle initial render state
  useEffect(() => {
    // After component mounts, set initialRender to false with a small delay
    // This prevents a flash of loading state on fast authentications
    const timer = setTimeout(() => setInitialRender(false), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // If session exists, redirect to dashboard
  if (session && !loading) {
    console.log("Auth page: Session exists, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  // Don't show loading spinner on initial render to prevent flickering
  if ((loading && !initialRender) || (loading && initialRender && !session)) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-gray-700">
        <CardHeader>
          <CardTitle className="text-center text-white">
            {showReset ? "Reset Password" : "Welcome to TASQI-AI"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showReset ? (
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
  );
};

export default Auth;
