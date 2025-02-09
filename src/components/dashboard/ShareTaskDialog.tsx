
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ShareTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TrustedUser {
  id: number;
  trusted_user_id: string;
  alias: string | null;
  profiles: {
    email: string;
  };
}

interface Group {
  id: number;
  name: string;
}

export function ShareTaskDialog({ task, open, onOpenChange }: ShareTaskDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [sharingType, setSharingType] = useState<"individual" | "group">("individual");

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

  const { data: groups = [] } = useQuery({
    queryKey: ['task-groups'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('task_groups')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    }
  });

  const handleShare = async () => {
    if (!task?.id) return;
    
    try {
      setIsSharing(true);

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('No authenticated user');

      if (sharingType === 'individual') {
        // Create shared task records for each selected user
        const sharedTaskPromises = selectedUserIds.map(userId =>
          supabase
            .from('shared_tasks')
            .insert({
              task_id: task.id,
              shared_with_user_id: userId,
              shared_by_user_id: currentUser.id,
              sharing_type: 'individual'
            })
            .select()
            .single()
        );

        const results = await Promise.all(sharedTaskPromises);
        const errors = results.filter(result => result.error);

        if (errors.length > 0) {
          throw new Error('Failed to share task with some users');
        }

        // Send notifications for each shared task
        await Promise.all(
          results.map(result => {
            if (result.data) {
              return supabase.functions.invoke('send-invitation', {
                body: { sharedTaskId: result.data.id }
              });
            }
            return Promise.resolve();
          })
        );
      } else {
        // Share with group
        const { data: sharedTask, error: shareError } = await supabase
          .from('shared_tasks')
          .insert({
            task_id: task.id,
            group_id: parseInt(selectedGroupId),
            shared_by_user_id: currentUser.id,
            sharing_type: 'group'
          })
          .select()
          .single();

        if (shareError) throw shareError;

        // Send notification for group share
        await supabase.functions.invoke('send-invitation', {
          body: { sharedTaskId: sharedTask.id }
        });
      }

      // Update the task's shared status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ shared: true })
        .eq('id', task.id);

      if (updateError) throw updateError;

      toast.success('Task shared successfully');
      onOpenChange(false);
      setSelectedUserIds([]);
      setSelectedGroupId("");
    } catch (error) {
      console.error('Error sharing task:', error);
      toast.error('Failed to share task. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(current =>
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Tabs defaultValue="individual" onValueChange={(value) => setSharingType(value as "individual" | "group")}>
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
                        onCheckedChange={() => toggleUser(user.trusted_user_id)}
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
                <Select onValueChange={setSelectedGroupId} value={selectedGroupId}>
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

          <div className="flex justify-end">
            <Button 
              onClick={handleShare} 
              disabled={isSharing || (sharingType === 'individual' ? selectedUserIds.length === 0 : !selectedGroupId)}
            >
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
