import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PlusCircle, Trash2, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export function NotesContent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    createNoteMutation.mutate();
  };

  return (
    <div className={`container mx-auto ${isMobile ? 'p-2' : 'p-4'} max-w-4xl h-[calc(100vh-144px)] overflow-y-auto`}>
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
          type="button"
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Tasqi AI Assisted Note
        </Button>
        <Button 
          type="submit" 
          className="w-full flex items-center justify-center gap-2"
          disabled={createNoteMutation.isPending}
        >
          <PlusCircle className="w-4 h-4" />
          Add Note
        </Button>
      </form>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4">Loading notes...</div>
        ) : notes?.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No notes yet</div>
        ) : (
          notes?.map((note) => (
            <Card key={note.id} className={`${isMobile ? 'p-3' : 'p-4'}`}>
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
          ))
        )}
      </div>
    </div>
  );
}