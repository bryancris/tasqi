
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Note } from "./types";

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditNoteDialog({ note, open, onOpenChange }: EditNoteDialogProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const queryClient = useQueryClient();

  // Reset form when note changes
  useState(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async () => {
      if (!note) return;
      
      const { error } = await supabase
        .from("notes")
        .update({ title, content })
        .eq("id", note.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    updateNoteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Make changes to your note here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px]"
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={updateNoteMutation.isPending}
          >
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
