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
      className={`h-8 w-8 ${isRecording ? 'text-red-500' : ''}`}
      onClick={onClick}
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}