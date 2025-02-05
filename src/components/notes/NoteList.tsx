import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  color: string;
}

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteNoteMutation.mutate(note.id)}
              className="text-red-500 hover:text-red-700 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}