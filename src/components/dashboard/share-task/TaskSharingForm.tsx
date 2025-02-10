
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTrustedUsers } from "@/hooks/use-trusted-users";
import { useTaskGroups } from "@/hooks/use-task-groups";

interface TaskSharingFormProps {
  selectedUserIds: string[];
  selectedGroupId: string;
  sharingType: "individual" | "group";
  onUserToggle: (userId: string) => void;
  onGroupSelect: (groupId: string) => void;
  onSharingTypeChange: (type: "individual" | "group") => void;
}

export function TaskSharingForm({
  selectedUserIds,
  selectedGroupId,
  sharingType,
  onUserToggle,
  onGroupSelect,
  onSharingTypeChange,
}: TaskSharingFormProps) {
  const { data: trustedUsers = [] } = useTrustedUsers();
  const { data: groups = [] } = useTaskGroups();

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
