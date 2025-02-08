
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function UserInviteForm() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSharing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }

      // Get the recipient's user ID from their email
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', recipientEmail)
        .single();

      if (profileError || !recipientProfile) {
        throw new Error('User not found');
      }

      // Create the shared task record
      const { error: shareError } = await supabase
        .from('shared_tasks')
        .insert({
          shared_by_user_id: session.user.id,
          shared_with_user_id: recipientProfile.id,
          status: 'pending'
        });

      if (shareError) throw shareError;

      toast.success(`Task shared with ${recipientEmail}`);
      setRecipientEmail("");
      
    } catch (error) {
      console.error('Error sharing task:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to share task");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <form onSubmit={handleShare} className="space-y-4">
      <div className="space-y-2">
        <Label>Share with User</Label>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="Enter email address"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    </form>
  );
}
