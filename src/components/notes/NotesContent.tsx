import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DictateNoteDialog } from "./DictateNoteDialog";
import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export function NotesContent() {
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
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

  return (
    <div className={`container mx-auto ${isMobile ? 'pt-20 px-4 pb-24' : 'p-4'} max-w-4xl h-[calc(100vh-144px)] overflow-y-auto`}>
      <NoteForm onOpenDictateDialog={() => setIsDictateDialogOpen(true)} />
      <NoteList notes={notes || []} isLoading={isLoading} />
      <DictateNoteDialog
        open={isDictateDialogOpen}
        onOpenChange={setIsDictateDialogOpen}
        onNoteCreated={() => {
          // This will trigger a refetch of the notes
          // No need to manually invalidate the query here as it's handled by the dialog
        }}
      />
    </div>
  );
}
