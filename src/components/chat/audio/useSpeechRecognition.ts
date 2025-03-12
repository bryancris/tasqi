
import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type SpeechRecognitionInstance = InstanceType<typeof SpeechRecognition>;

interface UseSpeechRecognitionProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export function useSpeechRecognition({
  onTranscriptionComplete,
  onError
}: UseSpeechRecognitionProps) {
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const [speechRecognitionFailed, setSpeechRecognitionFailed] = useState(false);

  const stopSpeechRecognition = useCallback(() => {
    // Clear any pending timeouts
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        console.log('Stopping speech recognition');
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
      recognitionRef.current = null;
      setIsActive(false);
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    if (speechRecognitionFailed) {
      console.log('Native speech recognition previously failed, skipping');
      return false;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      console.log('Speech recognition not supported in this browser');
      setSpeechRecognitionFailed(true);
      return false;
    }

    try {
      console.log('Starting native speech recognition');
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      // Clear any existing timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Add timeout to prevent hanging - reduced to 5 seconds for faster fallback
      timeoutIdRef.current = setTimeout(() => {
        console.log('Speech recognition timeout after 5 seconds');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.error('Error stopping timed out speech recognition:', e);
          }
          recognitionRef.current = null;
          onError('timeout');
        }
      }, 5000);

      recognition.onresult = (event) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        onTranscriptionComplete(transcript);
      };

      recognition.onerror = (event) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        console.error('Speech recognition error:', event.error);
        
        // Handle specific error types
        if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
          console.log(`Handling error "${event.error}" by falling back to OpenAI`);
          onError(event.error);
          return;
        }
        
        toast({
          title: `Speech Recognition Error: ${event.error}`,
          description: "Falling back to alternative transcription",
          variant: "destructive",
        });
        
        onError(event.error);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsActive(true);
      return true;
    } catch (error) {
      console.error('Failed to start native speech recognition:', error);
      setSpeechRecognitionFailed(true);
      return false;
    }
  }, [onTranscriptionComplete, onError, toast, speechRecognitionFailed]);

  const resetSpeechRecognitionFailed = useCallback(() => {
    setSpeechRecognitionFailed(false);
  }, []);

  return {
    isActive,
    startSpeechRecognition,
    stopSpeechRecognition,
    resetSpeechRecognitionFailed,
    speechRecognitionFailed
  };
}
