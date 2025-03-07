
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useEmailSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const signInWithEmail = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      toast.error(
        !email.trim() 
          ? "Email is required" 
          : "Password is required"
      );
      return false;
    }
    
    setIsLoading(true);

    try {
      console.log("Initiating sign in with email...");
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign in successful", data.session ? "Session exists" : "No session", "User:", data.user?.email);
      
      // If we got here, authentication succeeded
      toast.success("Sign in successful");

      // Force a redirect to dashboard after successful sign-in
      // This provides a more direct route than waiting for context updates
      if (data.session) {
        console.log("Sign in successful, redirecting to dashboard");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500); // Small delay to allow toast to be seen
      }
      
      return true;
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      toast.error(error.message || "Sign in failed. Please try again.");
      return false;
    } finally {
      // Important: Always reset loading state, even on success
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signInWithEmail
  };
}
