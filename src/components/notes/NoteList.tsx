import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Palette } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Note } from "./types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const COLORS = [
  '#8E9196', // Neutral Gray
  '#9b87f5', // Primary Purple
  '#7E69AB', // Secondary Purple
  '#F2FCE2', // Soft Green
  '#FEF7CD', // Soft Yellow
  '#FEC6A1', // Soft Orange
  '#E5DEFF', // Soft Purple
  '#FFDEE2', // Soft Pink
  '#FDE1D3', // Soft Peach
  '#D3E4FD', // Soft Blue
  '#F1F0FB', // Soft Gray (default)
];

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
}

export function NoteList({ notes, isLoading }: NoteListProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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

  if (isLoading) {
    return <div className="text-center py-4">Loading notes...</div>;
  }

  if (notes?.length === 0) {
    return <div className="text-center text-gray-500 py-4">No notes yet</div>;
  }

  return (
    <div className="space-y-3">
      {notes?.map((note) => (
        <Card 
          key={note.id} 
          className={`${isMobile ? 'p-3' : 'p-4'}`}
          style={{ backgroundColor: note.color }}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{note.title}</h3>
              <p className="text-gray-600 whitespace-pre-wrap mt-2 break-words">
                {note.content}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-primary shrink-0"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          note.color === color ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateNoteColorMutation.mutate({ noteId: note.id, color })}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteNoteMutation.mutate(note.id)}
                className="text-red-500 hover:text-red-700 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}