
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function UserInviteForm() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState<"view" | "edit" | "admin">("view");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }

      // First check if an invitation already exists
      const { data: existingInvitation, error: checkError } = await supabase
        .from('calendar_invitations')
        .select('*')
        .eq('recipient_email', inviteEmail)
        .eq('sender_id', session.user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingInvitation) {
        toast.error("An invitation has already been sent to this email");
        return;
      }

      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('calendar_invitations')
        .insert({
          recipient_email: inviteEmail,
          permission_level: permissionLevel,
          sender_id: session.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: { invitationId: invitation.id }
      });

      if (emailError) throw emailError;

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error("Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <form onSubmit={handleInviteUser} className="space-y-4">
      <div className="space-y-2">
        <Label>Invite User</Label>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            value={permissionLevel}
            onValueChange={(value: "view" | "edit" | "admin") => setPermissionLevel(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="edit">Edit</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isInviting}>
            {isInviting ? "Sending..." : "Invite"}
          </Button>
        </div>
      </div>
    </form>
  );
}
