
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Group {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
}

export function GroupsList({ refreshTrigger }: { refreshTrigger?: number }) {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['task-groups', refreshTrigger],
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

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const { error: membersError } = await supabase
        .from('task_group_members')
        .delete()
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const { error: groupError } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', groupId);

      if (groupError) throw groupError;

      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!groups?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No groups created yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex items-center justify-between p-3 bg-background rounded-lg border"
        >
          <span className="font-medium">{group.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGroup(group.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
