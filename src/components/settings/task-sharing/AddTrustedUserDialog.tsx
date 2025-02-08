
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        throw new Error('User not found');
      }

      // Add the trusted user
      const { error: addError } = await supabase
        .from('trusted_task_users')
        .insert({
          trusted_user_id: profile.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (addError) throw addError;

      toast.success('User added successfully');
      onUserAdded(); // This will trigger the list refresh
      onOpenChange(false);
      setEmail('');
    } catch (error: any) {
      console.error('Error adding trusted user:', error);
      // Provide a more specific error message based on the error type
      const errorMessage = error.message === 'User not found' 
        ? 'User not found. Please verify the email and try again.'
        : 'Failed to add user. Please try again.';
      toast.error(errorMessage);
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
