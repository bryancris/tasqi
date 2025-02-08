
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  email: string;
}

export function TrustedUsersList() {
  const [trustedUsers, setTrustedUsers] = useState<TrustedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrustedUsers = async () => {
    try {
      const { data: trustedUsersData, error: trustedUsersError } = await supabase
        .from('trusted_task_users')
        .select(`
          id,
          trusted_user_id,
          profiles:trusted_user_id (
            email
          )
        `);

      if (trustedUsersError) throw trustedUsersError;

      setTrustedUsers(
        trustedUsersData.map(user => ({
          id: user.id,
          trusted_user_id: user.trusted_user_id,
          email: (user.profiles as { email: string }).email
        }))
      );
    } catch (error) {
      console.error('Error loading trusted users:', error);
      toast.error('Failed to load trusted users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrustedUsers();
  }, []);

  const handleRemoveUser = async (id: number) => {
    try {
      const { error } = await supabase
        .from('trusted_task_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrustedUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Error removing trusted user:', error);
      toast.error('Failed to remove user');
    }
  };

  if (isLoading) {
    return <div>Loading trusted users...</div>;
  }

  return (
    <div className="space-y-4">
      {trustedUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trusted users added yet</p>
      ) : (
        <ul className="space-y-3">
          {trustedUsers.map((user) => (
            <li key={user.id} className="flex items-center justify-between bg-secondary/50 p-3 rounded-lg">
              <span className="text-sm">{user.email}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveUser(user.id)}
                className="h-8 w-8 text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
