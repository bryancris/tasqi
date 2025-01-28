import { Image, Send, Mic } from "lucide-react";
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
    <form onSubmit={onSubmit} className="border-t bg-white p-4 rounded-b-xl">
      <div className="relative flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Chat with AI to manage your tasks... (Press Enter to send)"
          className="pr-24 py-6 rounded-full bg-gray-50 border-gray-200"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 hover:bg-gray-100">
            <Image className="h-4 w-4" />
          </Button>
          <AudioRecorder onTranscriptionComplete={onMessageChange} />
          <Button 
            type="submit" 
            size="icon" 
            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </form>
  );
}