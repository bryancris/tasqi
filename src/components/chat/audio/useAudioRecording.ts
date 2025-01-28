import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMicrophoneAccess } from "./useMicrophoneAccess";

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();
  const { requestMicrophoneAccess } = useMicrophoneAccess();

  const startRecording = async () => {
    const stream = await requestMicrophoneAccess();
    if (!stream) return;

    try {
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

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}