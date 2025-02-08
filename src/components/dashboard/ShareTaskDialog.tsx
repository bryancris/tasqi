
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { toast } from "sonner";

interface ShareTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareTaskDialog({ task, open, onOpenChange }: ShareTaskDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSharing(true);

    try {
      // First get the recipient's user ID from their email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (profileError || !profiles) {
        throw new Error('User not found');
      }

      // Create the shared task record
      const { data: sharedTask, error: shareError } = await supabase
        .from('shared_tasks')
        .insert({
          task_id: task.id,
          shared_with_user_id: profiles.id,
          shared_by_user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (shareError) throw shareError;

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
      setRecipientEmail('');
    } catch (error) {
      console.error('Error sharing task:', error);
      toast.error('Failed to share task. Please verify the email and try again.');
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
        <form onSubmit={handleShare} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="Enter recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSharing}>
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
