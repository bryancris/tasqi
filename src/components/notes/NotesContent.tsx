
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DictateNoteDialog } from "./DictateNoteDialog";
import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";
import { Note } from "./types";

export function NotesContent() {
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  // Set up real-time subscription
  useEffect(() => {
    if (subscriptionRef.current) return; // Prevent multiple subscriptions

    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes'
        },
        () => {
          // Invalidate and refetch on any notes change
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        }
      )
      .subscribe((status) => {
        console.log('Notes subscription status:', status);
      });

    subscriptionRef.current = channel;

    // Cleanup subscription only when component unmounts
    return () => {
      console.log('Cleaning up notes subscription...');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [queryClient]);

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
    staleTime: 1000, // Prevent excessive refetches
  });

  return (
    <div className={`container mx-auto ${isMobile ? 'pt-20 px-4 pb-24 bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]' : 'p-4'} max-w-4xl h-[calc(100vh-144px)] overflow-y-auto`}>
      <NoteForm onOpenDictateDialog={() => setIsDictateDialogOpen(true)} />
      <NoteList notes={notes || []} isLoading={isLoading} />
      <DictateNoteDialog
        open={isDictateDialogOpen}
        onOpenChange={setIsDictateDialogOpen}
        onNoteCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        }}
      />
    </div>
  );
}
