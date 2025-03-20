
import { Shield, Users } from "lucide-react";
import { UserTable } from "./UserTable";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export function AdminSettings() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Query the user_roles table to check if the user is an admin
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          // User is an admin if they have a role of 'admin'
          setIsAdmin(data?.role === 'admin');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#8B5CF6]" />
          <h3 className="text-lg font-medium">Admin Settings</h3>
        </div>
        
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            You don't have permission to access admin settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#8B5CF6]" />
        <h3 className="text-lg font-medium">Admin Settings</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#8B5CF6]" />
            <h4 className="text-base font-medium">User Management</h4>
          </div>
          
          <UserTable />
        </div>
      </div>
    </div>
  );
}
