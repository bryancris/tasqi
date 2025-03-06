
import { Note } from "./types";
import { NoteCard } from "./NoteCard";
import { Spinner } from "@/components/ui/spinner";

interface NoteListProps {
  notes: Note[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function NoteList({ notes, isLoading, isAuthenticated }: NoteListProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
