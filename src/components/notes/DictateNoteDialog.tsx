
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DictateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated: () => void;
}

export function DictateNoteDialog({ open, onOpenChange, onNoteCreated }: DictateNoteDialogProps) {
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { session } = useAuth();

  const handleTranscriptionComplete = (text: string) => {
    setContent(text);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please record some content first");
      return;
    }

    setIsProcessing(true);
    try {
      // Get AI-generated title
      const { data, error: titleError } = await supabase.functions.invoke('process-note', {
        body: { content }
      });

      if (titleError) throw titleError;

      // Create the note
      const { error: noteError } = await supabase.from("notes").insert({
        title: data.title,
        content: content,
        user_id: session?.user.id
      });

      if (noteError) throw noteError;

      toast.success("Note created successfully");
      
      // Call onNoteCreated callback first
      onNoteCreated();
      
      // Then close the dialog explicitly
      onOpenChange(false);
      
      // Finally reset the content state
      setContent("");
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error("Failed to create note. Please try again.");
      // Don't close the dialog on error
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dictate a New Note</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
          </div>
          {content && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Recorded Content:</p>
              <p className="text-sm">{content}</p>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!content || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Create Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
