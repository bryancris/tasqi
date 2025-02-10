
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrustedUsers } from "@/hooks/use-trusted-users";
import { useTaskGroups } from "@/hooks/use-task-groups";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TaskSharingFormProps {
  taskId?: number;
  selectedUserIds: string[];
  selectedGroupId: string;
  sharingType: "individual" | "group";
  onUserToggle: (userId: string) => void;
  onGroupSelect: (groupId: string) => void;
  onSharingTypeChange: (type: "individual" | "group") => void;
}

export function TaskSharingForm({
  taskId,
  selectedUserIds,
  selectedGroupId,
  sharingType,
  onUserToggle,
  onGroupSelect,
  onSharingTypeChange,
}: TaskSharingFormProps) {
  const { data: trustedUsers = [] } = useTrustedUsers();
  const { data: groups = [] } = useTaskGroups();

  useEffect(() => {
    const fetchExistingShares = async () => {
      if (!taskId) return;

      const { data: sharedTasks } = await supabase
        .from('shared_tasks')
        .select('shared_with_user_id, group_id')
        .eq('task_id', taskId);

      if (sharedTasks) {
        // Update selected users based on existing shares
        const sharedUserIds = sharedTasks
          .filter(st => st.shared_with_user_id)
          .map(st => st.shared_with_user_id!);
          
        // Update all shared users at once
        sharedUserIds.forEach(userId => {
          if (!selectedUserIds.includes(userId)) {
            onUserToggle(userId);
          }
        });

        // Update group if shared with group
        const groupShare = sharedTasks.find(st => st.group_id);
        if (groupShare?.group_id) {
          onSharingTypeChange('group');
          onGroupSelect(groupShare.group_id.toString());
        }
      }
    };

    fetchExistingShares();
  }, [taskId]);

  return (
    <Tabs defaultValue={sharingType} onValueChange={(value) => onSharingTypeChange(value as "individual" | "group")}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="individual">Individual</TabsTrigger>
        <TabsTrigger value="group">Group</TabsTrigger>
      </TabsList>

      <TabsContent value="individual" className="space-y-4">
        <div className="space-y-2">
          <Label>Select Users</Label>
          <div className="space-y-2">
            {trustedUsers.map((user) => (
              <div key={user.trusted_user_id} className="flex items-center space-x-2">
                <Checkbox
                  id={user.trusted_user_id}
                  checked={selectedUserIds.includes(user.trusted_user_id)}
                  onCheckedChange={() => onUserToggle(user.trusted_user_id)}
                />
                <Label htmlFor={user.trusted_user_id}>
                  {user.alias || user.profiles.email}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="group" className="space-y-4">
        <div className="space-y-2">
          <Label>Select Group</Label>
          <Select onValueChange={onGroupSelect} value={selectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
    </Tabs>
  );
}
