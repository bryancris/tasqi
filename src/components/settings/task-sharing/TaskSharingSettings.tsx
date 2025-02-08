
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TrustedUsersList } from "./TrustedUsersList";
import { AddTrustedUserDialog } from "./AddTrustedUserDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupsList } from "./GroupsList";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  alias: string | null;
  profiles: {
    email: string;
  };
}

export function TaskSharingSettings() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: trustedUsers = [] } = useQuery({
    queryKey: ['trusted-users'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      
      const { data: trustedUsersData, error: trustedUsersError } = await supabase
        .from('trusted_task_users')
        .select('id, trusted_user_id, alias')
        .eq('user_id', session.user?.id);

      if (trustedUsersError) throw trustedUsersError;
      if (!trustedUsersData) return [];

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

      return trustedUsersWithProfiles;
    }
  });

  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGroupCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Task Sharing</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you share and collaborate on tasks with others
        </p>
      </div>
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Trusted Users</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
          <TrustedUsersList key={refreshTrigger} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Groups</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCreateGroupOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>
          <GroupsList key={refreshTrigger} />
        </div>
      </div>

      <AddTrustedUserDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onUserAdded={handleUserAdded}
      />
      
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        trustedUsers={trustedUsers}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
