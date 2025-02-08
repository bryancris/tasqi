
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TrustedUsersList } from "./TrustedUsersList";
import { AddTrustedUserDialog } from "./AddTrustedUserDialog";
import { Plus } from "lucide-react";

export function TaskSharingSettings() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
          <TrustedUsersList />
        </div>
      </div>

      <AddTrustedUserDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onUserAdded={() => {
          // Force refresh of the TrustedUsersList component
          window.location.reload();
        }}
      />
    </div>
  );
}
