
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTrustedUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddTrustedUserDialog({ open, onOpenChange, onUserAdded }: AddTrustedUserDialogProps) {
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      // First get the user ID from their email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profiles) {
        throw new Error('User not found');
      }

      // Add the trusted user
      const { error: addError } = await supabase
        .from('trusted_task_users')
        .insert({
          trusted_user_id: profiles.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (addError) throw addError;

      toast.success('User added successfully');
      onUserAdded();
      onOpenChange(false);
      setEmail('');
    } catch (error) {
      console.error('Error adding trusted user:', error);
      toast.error('Failed to add user. Please verify the email and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Trusted User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter user's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isAdding}>
              {isAdding ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
