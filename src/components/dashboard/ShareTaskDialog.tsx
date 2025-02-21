
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { toast } from "sonner";
import { TaskSharingForm } from "./share-task/TaskSharingForm";
import { shareTask } from "@/utils/share-task";

interface ShareTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareTaskDialog({ task, open, onOpenChange }: ShareTaskDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [sharingType, setSharingType] = useState<"individual" | "group">("individual");

  const handleShare = async () => {
    if (!task?.id) return;
    
    try {
      setIsSharing(true);

      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('No authenticated user');

      await shareTask({
        taskId: task.id,
        selectedUserIds,
        selectedGroupId,
        sharingType,
        currentUserId: currentUser.id,
      });
      
      // Create task assignment notifications
      const notificationPromises = selectedUserIds.map(userId =>
        supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'New Task Assignment',
            message: `You have been assigned to: ${task.title}`,
            type: 'task_assignment',
            reference_id: task.id.toString(),
            reference_type: 'task'
          })
      );

      await Promise.all(notificationPromises);
      
      toast.success('Task shared successfully');
      onOpenChange(false);
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
          <TaskSharingForm
            taskId={task?.id}
            selectedUserIds={selectedUserIds}
            selectedGroupId={selectedGroupId}
            sharingType={sharingType}
            onUserToggle={toggleUser}
            onGroupSelect={setSelectedGroupId}
            onSharingTypeChange={setSharingType}
          />

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
