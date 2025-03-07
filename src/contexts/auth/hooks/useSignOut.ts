
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook to handle sign out functionality with enhanced error handling
 */
export const useSignOut = () => {
  const signOut = useCallback(async () => {
    try {
      console.log("Signing out user...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error);
        toast.error("There was a problem signing out. Please try again.");
        throw error;
      }
      
      console.log("Sign out successful");
      toast.success("Successfully signed out");
      
      // AuthProvider will handle state updates through onAuthStateChange
      return true;
    } catch (err) {
      console.error("Exception during sign out:", err);
      return false;
    }
  }, []);
  
  return { signOut };
};
