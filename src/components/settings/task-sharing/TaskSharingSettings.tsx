
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TrustedUsersList } from "./TrustedUsersList";
import { AddTrustedUserDialog } from "./AddTrustedUserDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { Plus, Users } from "lucide-react";

export function TaskSharingSettings() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserAdded = () => {
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
          <div className="text-sm text-muted-foreground">
            No groups created yet
          </div>
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
        trustedUsers={[]} // We'll need to pass the actual trusted users list here
        onGroupCreated={() => {
          // We'll implement this later when we add the groups list component
        }}
      />
    </div>
  );
}
