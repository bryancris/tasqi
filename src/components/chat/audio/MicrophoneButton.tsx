import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicrophoneButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export function MicrophoneButton({ isRecording, onClick }: MicrophoneButtonProps) {
  return (
    <Button 
      type="button" 
      size="icon" 
      variant="ghost" 
      className={`h-8 w-8 relative ${isRecording ? 'text-red-500' : ''}`}
      onClick={onClick}
    >
      {isRecording && (
        <span className="absolute inset-0 animate-pulse">
          <span className="absolute inset-0 rounded-full border-2 border-red-500"></span>
        </span>
      )}
      <Mic className="h-4 w-4" />
    </Button>
  );
}