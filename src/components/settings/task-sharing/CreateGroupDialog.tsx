
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  alias: string | null;
  profiles: {
    email: string;
  };
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trustedUsers: TrustedUser[];
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  trustedUsers,
  onGroupCreated 
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsCreating(true);
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('task_groups')
        .insert({
          name: groupName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add selected users as group members
      const membersToInsert = selectedUsers.map(userId => ({
        group_id: groupData.id,
        trusted_user_id: userId,
      }));

      const { error: membersError } = await supabase
        .from('task_group_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      toast.success('Group created successfully');
      onGroupCreated();
      onOpenChange(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Users</Label>
            <div className="border rounded-md p-2 space-y-2 max-h-[200px] overflow-y-auto">
              {trustedUsers.map((user) => (
                <div key={user.trusted_user_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.trusted_user_id}`}
                    checked={selectedUsers.includes(user.trusted_user_id)}
                    onCheckedChange={() => toggleUser(user.trusted_user_id)}
                  />
                  <label
                    htmlFor={`user-${user.trusted_user_id}`}
                    className="text-sm cursor-pointer"
                  >
                    {user.alias || user.profiles.email}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
