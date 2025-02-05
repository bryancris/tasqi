import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface NoteFormProps {
  onOpenDictateDialog: () => void;
}

export function NoteForm({ onOpenDictateDialog }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert([
        {
          title,
          content,
          user_id: session?.user.id,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setTitle("");
      setContent("");
      toast.success("Note created successfully");
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    createNoteMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3">
      <Input
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
      />
      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`w-full ${isMobile ? 'min-h-[100px]' : 'min-h-[150px]'}`}
      />
      <Button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2"
        disabled={createNoteMutation.isPending}
      >
        <PlusCircle className="w-4 h-4" />
        Add Note
      </Button>
      <Button 
        type="button"
        variant="secondary"
        className="w-full flex items-center justify-center gap-2"
        onClick={onOpenDictateDialog}
      >
        <Bot className="w-4 h-4" />
        Tasqi AI Assisted Note
      </Button>
    </form>
  );
}