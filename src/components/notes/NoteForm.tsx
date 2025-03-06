
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Bot, Palette, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isDevAuthBypassed } from "@/contexts/auth/provider/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  isAuthenticated: boolean;
}

export function NoteForm({ onOpenDictateDialog, isAuthenticated }: NoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#F1F0FB");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const createNoteMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to create notes");
      }

      const userId = session?.user.id || (isDevAuthBypassed() ? '00000000-0000-0000-0000-000000000000' : null);
      
      if (!userId) {
        throw new Error("User ID not available");
      }

      const { error, data } = await supabase.from("notes").insert([
        {
          title,
          content,
          color,
          user_id: userId,
        },
      ]).select();

      if (error) {
        console.error("Error from Supabase:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.refetchQueries({ queryKey: ["notes"] });
      setTitle("");
      setContent("");
      setColor("#F1F0FB");
      toast.success("Note created successfully");
    },
    onError: (error) => {
      console.error("Error creating note:", error);
      if (error instanceof Error) {
        toast.error(`Failed to create note: ${error.message}`);
      } else {
        toast.error("Failed to create note");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to create notes");
      return;
    }
    
    createNoteMutation.mutate();
  };

  const isDevMode = () => {
    return process.env.NODE_ENV === 'development' || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3">
      {!isAuthenticated && isDevMode() && (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No active session. Use the Dev Auth Tools in the bottom right to bypass auth for testing.
          </AlertDescription>
        </Alert>
      )}

      <Button 
        type="button"
        variant="rainbow"
        className="w-full flex items-center justify-center gap-2 mb-2"
        onClick={onOpenDictateDialog}
        disabled={!isAuthenticated}
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
          disabled={!isAuthenticated}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              className="shrink-0"
              style={{ backgroundColor: color }}
              disabled={!isAuthenticated}
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
        disabled={!isAuthenticated}
      />
      <Button 
        type="submit" 
        className="w-full h-8 flex items-center justify-center gap-2 text-white bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] border-2 border-[#0EA5E9]/50 hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
        disabled={createNoteMutation.isPending || !isAuthenticated}
      >
        <PlusCircle className="w-4 h-4" />
        Add Note
      </Button>
    </form>
  );
}
