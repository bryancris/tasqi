import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Note } from "./types";
import { EditNoteDialog } from "./EditNoteDialog";
import { useState } from "react";
import { NoteCard } from "./NoteCard";

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
}

export function NoteList({ notes, isLoading }: NoteListProps) {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    },
  });

  const updateNoteColorMutation = useMutation({
    mutationFn: async ({ noteId, color }: { noteId: number; color: string }) => {
      const { error } = await supabase
        .from("notes")
        .update({ color })
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note color updated");
    },
    onError: (error) => {
      console.error("Error updating note color:", error);
      toast.error("Failed to update note color");
    },
  });

  const handleNoteClick = (note: Note, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading notes...</div>;
  }

  if (notes?.length === 0) {
    return <div className="text-center text-gray-500 py-4">No notes yet</div>;
  }

  return (
    <div className="space-y-3">
      {notes?.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={(id) => deleteNoteMutation.mutate(id)}
          onColorChange={(id, color) => 
            updateNoteColorMutation.mutate({ noteId: id, color })}
          onClick={handleNoteClick}
        />
      ))}
      <EditNoteDialog
        note={selectedNote}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}