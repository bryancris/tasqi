
import { useState, useRef, useCallback } from 'react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { useSilenceDetection } from './useSilenceDetection';
import { createAudioAnalyser, getAudioMimeType } from './audioUtils';
import { useToast } from '@/hooks/use-toast';

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { requestMicrophoneAccess } = useMicrophoneAccess();
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const { startSilenceDetection, stopSilenceDetection } = useSilenceDetection(stopRecording);

  const startNativeRecording = useCallback(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      return false;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscriptionComplete(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Speech Recognition Error",
          description: "Please try again or use the keyboard",
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start native speech recognition:', error);
      return false;
    }
  }, [onTranscriptionComplete, toast]);

  const startRecording = useCallback(async () => {
    // Try native speech recognition first
    if (startNativeRecording()) {
      return;
    }

    // Fall back to OpenAI implementation
    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) return;

      const { analyser } = createAudioAnalyser(stream);
      const { mimeType, codecType } = getAudioMimeType();
      
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

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const reader = new FileReader();
        
        reader.onload = async () => {
          if (reader.result && typeof reader.result === 'string') {
            const base64Audio = reader.result.split(',')[1];
            
            try {
              const response = await fetch('https://mcwlzrikidzgxexnccju.supabase.co/functions/v1/voice-to-text', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio: base64Audio }),
              });

              if (!response.ok) {
                throw new Error('Transcription failed');
              }

              const { text } = await response.json();
              onTranscriptionComplete(text);
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
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Please try again or use the keyboard",
        variant: "destructive",
      });
    }
  }, [onTranscriptionComplete, requestMicrophoneAccess, startSilenceDetection, stopSilenceDetection, toast]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
