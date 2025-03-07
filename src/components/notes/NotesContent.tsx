
import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { DictateNoteDialog } from "./DictateNoteDialog";
import { NoteForm } from "./NoteForm";
import { NoteList } from "./NoteList";
import { Note } from "./types";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useAuth } from "@/contexts/auth";
import { isDevAuthBypassed } from "@/contexts/auth/provider/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function NotesContent() {
  const [isDictateDialogOpen, setIsDictateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { session, initialized } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication state when the component mounts and auth is initialized
  useEffect(() => {
    if (initialized) {
      setAuthChecked(true);
    }
  }, [initialized]);

  const isAuthenticated = session !== null || isDevAuthBypassed();

  const { data: notes, isLoading, refetch } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping notes fetch");
        return [];
      }

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
    enabled: isAuthenticated && authChecked, // Only run query when authenticated
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

  const isDevMode = () => {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };

  return (
    <div 
      className={`container mx-auto ${
        isMobile ? 'pt-4 px-4 pb-16 bg-gradient-to-b from-[#F1F0FB] to-[#E5DEFF]' : 'p-4'
      } max-w-4xl h-[calc(100vh-144px)] overflow-y-auto`}
    >
      <ErrorBoundary>
        {!isAuthenticated && authChecked && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to create and view notes. {isDevMode() && "Use the Dev Auth Tools in the bottom right to bypass auth for testing."}
            </AlertDescription>
          </Alert>
        )}
        
        <NoteForm 
          onOpenDictateDialog={() => setIsDictateDialogOpen(true)}
          isAuthenticated={isAuthenticated}
        />
        
        <NoteList 
          notes={notes || []} 
          isLoading={isLoading} 
          isAuthenticated={isAuthenticated}
        />
        
        <DictateNoteDialog
          open={isDictateDialogOpen}
          onOpenChange={setIsDictateDialogOpen}
          onNoteCreated={handleNoteCreated}
        />
      </ErrorBoundary>
    </div>
  );
}
