import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMicrophoneAccess } from "./useMicrophoneAccess";

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const { toast } = useToast();
  const { requestMicrophoneAccess } = useMicrophoneAccess();

  const checkForSilence = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    // If volume is below threshold (silence), start timeout
    if (average < 5) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, 1500); // Stop after 1.5 seconds of silence
      }
    } else {
      // Reset timeout if sound is detected
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }

    // Continue checking while recording
    if (isRecording) {
      requestAnimationFrame(checkForSilence);
    }
  };

  const startRecording = async () => {
    const stream = await requestMicrophoneAccess();
    if (!stream) return;

    try {
      // Set up audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Use different MIME types based on platform
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const mimeType = isIOS ? 'audio/mp4' : 'audio/webm';
      
      const recorder = new MediaRecorder(stream, {
        mimeType: isIOS ? 'audio/mp4' : 'audio/webm;codecs=opus'
      });
      
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;

        const audioBlob = new Blob(audioChunks, { type: mimeType });
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
      
      // Start checking for silence
      requestAnimationFrame(checkForSilence);
      
      toast({
        title: "Recording Started",
        description: "Recording will automatically stop after silence is detected.",
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
      // Clear any existing silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

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