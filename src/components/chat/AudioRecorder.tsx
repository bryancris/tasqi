import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const checkMicrophoneAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      if (audioDevices.length === 0) {
        toast({
          title: "No Microphone Found",
          description: "Please connect a microphone to use voice input.",
          variant: "destructive",
        });
        return false;
      }
      
      // Test microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Clean up the test stream immediately
          stream.getTracks().forEach(track => track.stop());
        });
      
      return true;
    } catch (error) {
      console.error('Error checking microphone:', error);
      let errorMessage = "Could not access microphone. ";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = "Please grant microphone permissions in your browser settings.";
            break;
          case 'NotFoundError':
            errorMessage = "No microphone found. Please check your device connections.";
            break;
          case 'NotReadableError':
            errorMessage = "Microphone is in use by another application.";
            break;
          default:
            errorMessage = "Please check your microphone permissions and connections.";
        }
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = async () => {
    const micAvailable = await checkMicrophoneAvailability();
    if (!micAvailable) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;
              if (data.text) {
                onTranscriptionComplete(data.text);
              }
            } catch (error) {
              console.error('Error transcribing audio:', error);
              toast({
                title: "Transcription Failed",
                description: "Could not convert your speech to text. Please try again.",
                variant: "destructive",
              });
            }
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Click the microphone button again to stop recording.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Processing your audio...",
      });
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button 
      type="button" 
      size="icon" 
      variant="ghost" 
      className={`h-8 w-8 ${isRecording ? 'text-red-500' : ''}`}
      onClick={handleMicClick}
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}