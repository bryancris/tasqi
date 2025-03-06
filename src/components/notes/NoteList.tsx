
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Note } from "./types";
import { NoteCard } from "./NoteCard";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditNoteDialog } from "./EditNoteDialog";

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function NoteList({ notes, isLoading, isAuthenticated }: NoteListProps) {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const queryClient = useQueryClient();

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId);
      
      if (error) {
        throw error;
      }
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

  // Update note color mutation
  const updateNoteColorMutation = useMutation({
    mutationFn: async ({ id, color }: { id: number; color: string }) => {
      const { error } = await supabase
        .from("notes")
        .update({ color })
        .eq("id", id);
      
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error) => {
      console.error("Error updating note color:", error);
      toast.error("Failed to update note color");
    },
  });

  // Handle note click (open for editing)
  const handleNoteClick = (note: Note, event: React.MouseEvent) => {
    // Don't open note for editing if clicking on the color picker or delete button
    const target = event.target as HTMLElement;
    const isActionButton = target.closest('button') && !target.closest('button')?.classList.contains('card');
    
    if (!isActionButton) {
      setEditingNote(note);
    }
  };

  // Handle note deletion
  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(noteId);
  };

  // Handle color change
  const handleColorChange = (noteId: number, color: string) => {
    updateNoteColorMutation.mutate({ id: noteId, color });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please log in to view your notes</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No notes found. Create one above!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map((note) => (
          <NoteCard 
            key={note.id} 
            note={note}
            onDelete={handleDeleteNote}
            onColorChange={handleColorChange}
            onClick={handleNoteClick}
          />
        ))}
      </div>

      {editingNote && (
        <EditNoteDialog 
          open={!!editingNote} 
          onOpenChange={() => setEditingNote(null)} 
          note={editingNote}
        />
      )}
    </>
  );
}
