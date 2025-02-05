import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Note } from "./types";
import { ColorPicker } from "./ColorPicker";
import { useIsMobile } from "@/hooks/use-mobile";

interface NoteCardProps {
  note: Note;
  onDelete: (id: number) => void;
  onColorChange: (id: number, color: string) => void;
  onClick: (note: Note, event: React.MouseEvent) => void;
}

export function NoteCard({ note, onDelete, onColorChange, onClick }: NoteCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card 
      className={`${isMobile ? 'p-3' : 'p-4'} cursor-pointer`}
      style={{ backgroundColor: note.color }}
      onClick={(e) => onClick(note, e)}
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
          <ColorPicker
            selectedColor={note.color}
            onColorSelect={(color) => onColorChange(note.id, color)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(note.id)}
            className="text-red-500 hover:text-red-700 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}