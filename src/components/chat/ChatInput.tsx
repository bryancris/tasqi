
import { Send, Mic, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AudioRecorder } from "./AudioRecorder";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export function ChatInput({ message, onMessageChange, onSubmit, isLoading }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-purple-100 bg-gradient-to-r from-[#E5DEFF] to-[#F1F0FB] p-4 rounded-b-xl">
      <div className="relative flex items-center gap-2">
        <div className="absolute left-3 flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-500" type="button">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Type <strong>/clear</strong> to clear chat history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Chat with AI to manage your tasks... (Press Enter to send)"
          className="pl-10 pr-24 py-6 rounded-full bg-white/80 backdrop-blur-sm border-purple-100 focus:border-purple-200 focus:ring-purple-200"
          disabled={isLoading}
        />
        <div className="absolute right-2 flex items-center gap-1">
          <AudioRecorder onTranscriptionComplete={onMessageChange} />
          <Button 
            type="submit" 
            size="icon" 
            className="h-8 w-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md transition-all duration-200"
            disabled={isLoading}
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </form>
  );
}
