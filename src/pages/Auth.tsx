
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);

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
                  <div className="space-y-4">
                    <SignInForm />
                    <Button
                      variant="ghost"
                      className="w-full text-white/70 hover:text-white"
                      onClick={() => setShowReset(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
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
