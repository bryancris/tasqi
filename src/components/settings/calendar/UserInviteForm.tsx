
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

      toast.success(`Invitation sent to ${recipientEmail}`);
      setRecipientEmail("");
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send invitation");
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
