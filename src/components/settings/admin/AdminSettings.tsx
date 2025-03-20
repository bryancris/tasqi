
import { Shield, Users } from "lucide-react";
import { UserTable } from "./UserTable";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
        // In a real application, you would check from a user_roles table
        // For now, we'll just assume the user is an admin if they're authenticated
        setIsAdmin(true);
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
        <div className="animate-pulse">Loading admin settings...</div>
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
