
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
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

      // Create the shared task record
      const { data: sharedTask, error: shareError } = await supabase
        .from('shared_tasks')
        .insert({
          task_id: task.id,
          shared_with_user_id: sharingType === 'individual' ? selectedUserId : null,
          group_id: sharingType === 'group' ? parseInt(selectedGroupId) : null,
          shared_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          sharing_type: sharingType
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Update the task's shared status
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ shared: true })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Send email notification using the Edge Function
      const { error: notificationError } = await supabase.functions.invoke('send-invitation', {
        body: {
          sharedTaskId: sharedTask.id
        }
      });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
        toast.error('Task shared but notification could not be sent');
      } else {
        toast.success('Task shared successfully');
      }

      onOpenChange(false);
      setSelectedUserId("");
      setSelectedGroupId("");
    } catch (error) {
      console.error('Error sharing task:', error);
      toast.error('Failed to share task. Please try again.');
    } finally {
      setIsSharing(false);
    }
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
                <Label>Select User</Label>
                <Select onValueChange={setSelectedUserId} value={selectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trusted user" />
                  </SelectTrigger>
                  <SelectContent>
                    {trustedUsers.map((user) => (
                      <SelectItem key={user.trusted_user_id} value={user.trusted_user_id}>
                        {user.alias || user.profiles.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              disabled={isSharing || (!selectedUserId && !selectedGroupId)}
            >
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
