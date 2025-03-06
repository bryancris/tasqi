
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DictateNoteDialog } from "./DictateNoteDialog";
import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";
import { Note } from "./types";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function NotesContent() {
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      console.log("Executing notes query fetch");
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} notes`);
      return data as Note[];
    },
    staleTime: 0, // Consider data always stale to ensure refetch
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const handleNoteCreated = useCallback(() => {
    console.log("Note created, forcing refetch");
    // Force an immediate refetch of the notes data
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    
    // Also directly trigger refetch as a backup mechanism
    refetch();
    
    // Close the dialog
    setIsDictateDialogOpen(false);
  }, [queryClient, refetch]);

  return (
    <div 
      className={`container mx-auto ${
        isMobile ? 'pt-4 px-4 pb-16 bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]' : 'p-4'
      } max-w-4xl h-[calc(100vh-144px)] overflow-y-auto`}
    >
      <ErrorBoundary>
        <NoteForm onOpenDictateDialog={() => setIsDictateDialogOpen(true)} />
        <NoteList notes={notes || []} isLoading={isLoading} />
        <DictateNoteDialog
          open={isDictateDialogOpen}
          onOpenChange={setIsDictateDialogOpen}
          onNoteCreated={handleNoteCreated}
        />
      </ErrorBoundary>
    </div>
  );
}
