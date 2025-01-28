import { Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AudioRecorder } from "./AudioRecorder";

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({ message, onMessageChange, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t p-4">
      <div className="relative">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Chat with AI to manage your tasks... (Press Enter to send)"
          className="pr-32 py-6"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
            <Image className="h-4 w-4" />
          </Button>
          <AudioRecorder onTranscriptionComplete={onMessageChange} />
          <Button type="submit" size="icon" className="h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}