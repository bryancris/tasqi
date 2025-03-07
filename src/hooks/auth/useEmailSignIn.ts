
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

      // Use a more reliable approach for session handling
      if (data.session) {
        // Store sign-in success in localStorage to help with potential state loss
        window.localStorage.setItem('auth_success', 'true');
        console.log("Auth success flag set in localStorage");
        
        // First, ensure the session is properly stored by explicitly setting it
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        // Then force a refresh to ensure state is consistent
        await supabase.auth.refreshSession();
        
        // Redirect with a delay to allow context to update
        console.log("Sign in successful, redirecting to dashboard");
        
        // Attempt to redirect multiple times with increasing delays
        // to ensure navigation happens after auth context is updated
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
        
        setTimeout(() => {
          // Check if we're still on the auth page (indicating first redirect failed)
          if (window.location.pathname.includes('/auth')) {
            console.log("First redirect attempt may have failed, trying again");
            navigate("/dashboard", { replace: true });
          }
        }, 500);
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
