
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAuthCheck() {
  const { session, user } = useAuth();
  const [directUserId, setDirectUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuthDirectly = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          console.log("Direct auth check successful:", data.user.id);
          setDirectUserId(data.user.id);
        }
      } catch (error) {
        console.error("Error in direct auth check:", error);
      }
    };
    
    checkAuthDirectly();
  }, []);

  const isAuthenticated = !!(session || user || directUserId);
  const userId = session?.user?.id || user?.id || directUserId;

  return {
    isAuthenticated,
    userId,
    contextAuth: !!(session || user),
    contextUserId: session?.user?.id || user?.id,
    directUserId
  };
}
