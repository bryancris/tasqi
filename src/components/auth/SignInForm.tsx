
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

export function SignInForm({ onResetPassword }: { onResetPassword: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return; // Prevent multiple submission attempts
    
    setIsLoading(true);

    try {
      // Pre-validate input to avoid unnecessary network requests
      if (!email.trim()) throw new Error("Email is required");
      if (!password.trim()) throw new Error("Password is required");
      
      console.log("Initiating sign in with email...");
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign in successful, redirecting...");
      
      // Store minimal auth data for faster subsequent loads
      try {
        if (data?.session && data?.user) {
          localStorage.setItem('sb-session', JSON.stringify(data.session));
          localStorage.setItem('sb-user', JSON.stringify(data.user));
        }
      } catch (e) {
        console.warn("Error storing auth data:", e);
      }
      
      // Navigate after successful sign in
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Sign in failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return; // Prevent multiple clicks
    
    try {
      setIsGoogleLoading(true);
      console.log("Initiating Google sign in...");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Google sign in failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            aria-label="Email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            aria-label="Password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In with Email"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#1a1b3b] px-2 text-white/70">Or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isGoogleLoading || isLoading}
        className="w-full"
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          "Connecting..."
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg role="img" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
            Sign in with Google
          </div>
        )}
      </Button>

      <Button
        variant="ghost"
        className="w-full text-white/70 hover:text-white"
        onClick={onResetPassword}
        disabled={isLoading || isGoogleLoading}
      >
        Forgot password?
      </Button>
    </div>
  );
}
