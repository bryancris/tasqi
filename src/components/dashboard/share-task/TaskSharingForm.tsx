
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrustedUsers } from "@/hooks/use-trusted-users";
import { useTaskGroups } from "@/hooks/use-task-groups";
import { useEffect, useCallback, useRef } from "react";
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
  const initialFetchDone = useRef(false);

  // Only depend on taskId to prevent infinite loops
  const fetchExistingShares = useCallback(async () => {
    if (!taskId || initialFetchDone.current) return;

    try {
      const { data: sharedTasks } = await supabase
        .from('shared_tasks')
        .select('shared_with_user_id, group_id')
        .eq('task_id', taskId);

      if (sharedTasks && sharedTasks.length > 0) {
        // Batch all state updates together
        const updates: (() => void)[] = [];
        
        // Collect user updates
        const sharedUserIds = sharedTasks
          .filter(st => st.shared_with_user_id)
          .map(st => st.shared_with_user_id!)
          .filter(id => !selectedUserIds.includes(id));
          
        if (sharedUserIds.length > 0) {
          updates.push(() => {
            sharedUserIds.forEach(userId => onUserToggle(userId));
          });
        }

        // Collect group updates
        const groupShare = sharedTasks.find(st => st.group_id);
        if (groupShare?.group_id && groupShare.group_id.toString() !== selectedGroupId) {
          updates.push(() => {
            onSharingTypeChange('group');
            onGroupSelect(groupShare.group_id.toString());
          });
        }

        // Apply all updates in one batch
        requestAnimationFrame(() => {
          updates.forEach(update => update());
        });
      }

      initialFetchDone.current = true;
    } catch (error) {
      console.error('Error fetching shared tasks:', error);
    }
  }, [taskId]); // Only depend on taskId

  useEffect(() => {
    fetchExistingShares();
  }, [fetchExistingShares]);

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
