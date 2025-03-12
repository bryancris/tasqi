
import { useState, useRef, useCallback } from 'react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { useSilenceDetection } from './useSilenceDetection';
import { createAudioAnalyser, getAudioMimeType } from './audioUtils';
import { useToast } from '@/hooks/use-toast';

export function useOpenAITranscription(onTranscriptionComplete: (text: string) => void) {
  const [isActive, setIsActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { requestMicrophoneAccess } = useMicrophoneAccess();
  const { toast } = useToast();

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isActive) {
      mediaRecorderRef.current.stop();
      setIsActive(false);
    }
  }, [isActive]);

  const { startSilenceDetection, stopSilenceDetection } = useSilenceDetection(stopRecording);

  const startRecording = useCallback(async () => {
    console.log('⚠️ Using OpenAI transcription');
    
    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        console.error('Failed to get microphone access for OpenAI transcription');
        setIsActive(false);
        return;
      }

      const { analyser } = createAudioAnalyser(stream);
      const { mimeType, codecType } = getAudioMimeType();
      
      console.log(`📱 Recording with ${mimeType} (${codecType})`);
      const recorder = new MediaRecorder(stream, { mimeType: codecType });
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        stopSilenceDetection();
        setIsActive(false);

        if (audioChunks.length === 0) {
          console.error('No audio data captured');
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const reader = new FileReader();
        
        reader.onload = async () => {
          if (reader.result && typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            
            try {
              console.log('Sending audio to transcription service...');
              const response = await fetch('https://mcwlzrikidzgxexnccju.supabase.co/functions/v1/voice-to-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio: base64Audio }),
              });

              if (!response.ok) {
                throw new Error(`Transcription failed with status: ${response.status}`);
              }

              const { text } = await response.json();
              console.log('Transcription received:', text);
              
              if (text && text.trim()) {
                onTranscriptionComplete(text);
              } else {
                console.warn('Empty transcription received');
                toast({
                  title: "No Speech Detected",
                  description: "Please speak more clearly or try again",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error('Transcription error:', error);
              toast({
                title: "Transcription Failed",
                description: "Please try again or use the keyboard",
                variant: "destructive",
              });
            }
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      startSilenceDetection(analyser);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start recording with OpenAI transcription:', error);
      toast({
        title: "Recording Failed",
        description: "Please try again or use the keyboard",
        variant: "destructive",
      });
      setIsActive(false);
    }
  }, [onTranscriptionComplete, requestMicrophoneAccess, startSilenceDetection, stopSilenceDetection, toast]);

  return {
    isActive,
    startRecording,
    stopRecording
  };
}
