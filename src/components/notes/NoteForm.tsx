import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Bot, Palette } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface NoteFormProps {
  onOpenDictateDialog: () => void;
}

export function NoteForm({ onOpenDictateDialog }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#F1F0FB");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      const { error, data } = await supabase.from("notes").insert([
        {
          title,
          content,
          color,
          user_id: session?.user.id,
        },
      ]).select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setTitle("");
      setContent("");
      setColor("#F1F0FB");
      toast.success("Note created successfully");
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
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
    <form onSubmit={handleSubmit} className="mb-4 space-y-3">
      <Button 
        type="button"
        variant="rainbow"
        className="w-full flex items-center justify-center gap-2 mb-2"
        onClick={onOpenDictateDialog}
      >
        <Bot className="w-4 h-4" />
        Tasqi AI Assisted Note
      </Button>

      <div className="flex gap-2">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              className="shrink-0"
              style={{ backgroundColor: color }}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-5 gap-2 p-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={(e) => {
                    e.preventDefault();
                    setColor(c);
                  }}
                  type="button"
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`w-full ${isMobile ? 'min-h-[100px]' : 'min-h-[150px]'}`}
      />
      <Button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2"
        disabled={createNoteMutation.isPending}
      >
        <PlusCircle className="w-4 h-4" />
        Add Note
      </Button>
    </form>
  );
}
