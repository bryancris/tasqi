
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Check, X } from "lucide-react";

interface Profile {
  email: string;
}

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  alias: string | null;
  profiles: Profile;
}

export function TrustedUsersList() {
  const [trustedUsers, setTrustedUsers] = useState<TrustedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAlias, setEditingAlias] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTrustedUsers = async () => {
    try {
      const { data: session } = await supabase.auth.getUser();
      
      const { data: trustedUsersData, error: trustedUsersError } = await supabase
        .from('trusted_task_users')
        .select('id, trusted_user_id, alias')
        .eq('user_id', session.user?.id);

      if (trustedUsersError) throw trustedUsersError;
      if (!trustedUsersData) return;

      const trustedUsersWithProfiles = await Promise.all(
        trustedUsersData.map(async (user) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.trusted_user_id)
            .single();

          return {
            id: user.id,
            trusted_user_id: user.trusted_user_id,
            alias: user.alias,
            profiles: {
              email: profileData?.email || 'Unknown email'
            }
          };
        })
      );

      setTrustedUsers(trustedUsersWithProfiles);
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

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

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

  const startEditing = (user: TrustedUser) => {
    setEditingId(user.id);
    setEditingAlias(user.alias || '');
  };

  const saveAlias = async (id: number) => {
    try {
      const { error } = await supabase
        .from('trusted_task_users')
        .update({ alias: editingAlias })
        .eq('id', id);

      if (error) throw error;

      setTrustedUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === id ? { ...user, alias: editingAlias } : user
        )
      );
      setEditingId(null);
      toast.success('Alias updated successfully');
    } catch (error) {
      console.error('Error updating alias:', error);
      toast.error('Failed to update alias');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingAlias("");
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
              <span className="text-sm">{user.profiles.email}</span>
              <div className="flex items-center gap-3">
                {editingId === user.id ? (
                  <>
                    <Input
                      ref={inputRef}
                      type="text"
                      value={editingAlias}
                      onChange={(e) => setEditingAlias(e.target.value)}
                      placeholder="Enter alias"
                      className="h-8 w-32"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => saveAlias(user.id)}
                      className="h-8 w-8 text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEditing}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => startEditing(user)}
                    className="h-8 px-3 text-sm"
                  >
                    {user.alias || "Add alias"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveUser(user.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
