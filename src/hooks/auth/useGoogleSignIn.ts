
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    
    try {
      console.log("Initiating Google sign in...");
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      console.log("Google sign in response:", error ? "Error occurred" : "No error", 
                  data?.url ? "Redirect URL exists" : "No redirect URL");

      if (error) throw error;
      
      // No need to reset Google loading state here as we're redirecting
      return true;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      toast.error(error.message || "Google sign in failed. Please try again.");
      setIsLoading(false);
      return false;
    }
  };

  return {
    isLoading,
    signInWithGoogle
  };
}
