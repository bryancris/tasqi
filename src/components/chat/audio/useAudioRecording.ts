
import { useState, useRef, useCallback } from 'react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { useSilenceDetection } from './useSilenceDetection';
import { createAudioAnalyser, getAudioMimeType } from './audioUtils';
import { useToast } from '@/hooks/use-toast';

type SpeechRecognitionInstance = InstanceType<typeof SpeechRecognition>;

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { requestMicrophoneAccess } = useMicrophoneAccess();
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [nativeSpeechFailed, setNativeSpeechFailed] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    // Clear any pending timeouts
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
      recognitionRef.current = null;
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsFallbackActive(false);
    }
  }, [isRecording]);

  const { startSilenceDetection, stopSilenceDetection } = useSilenceDetection(stopRecording);

  // Function to fallback to OpenAI transcription
  const fallbackToOpenAI = useCallback(async () => {
    // Prevent duplicate fallbacks
    if (isFallbackActive) {
      console.log('⚠️ OpenAI fallback already active, ignoring duplicate call');
      return;
    }

    console.log('⚠️ Falling back to OpenAI transcription');
    setNativeSpeechFailed(true);
    setIsFallbackActive(true);
    
    // Stop existing recognition if running
    if (recognitionRef.current) {
      try {
        console.log('Stopping speech recognition before fallback');
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition before fallback:', e);
      }
      recognitionRef.current = null;
    }
    
    try {
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        console.error('Failed to get microphone access for fallback');
        setIsRecording(false);
        setIsFallbackActive(false);
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
        setIsFallbackActive(false);

        if (audioChunks.length === 0) {
          console.error('No audio data captured');
          setIsRecording(false);
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
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording with OpenAI fallback:', error);
      toast({
        title: "Recording Failed",
        description: "Please try again or use the keyboard",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsFallbackActive(false);
    }
  }, [onTranscriptionComplete, requestMicrophoneAccess, startSilenceDetection, stopSilenceDetection, toast, isFallbackActive]);

  const startNativeRecording = useCallback(() => {
    if (nativeSpeechFailed) {
      console.log('Native speech recognition previously failed, skipping');
      return false;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      console.log('Speech recognition not supported in this browser');
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
          fallbackToOpenAI();
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
          fallbackToOpenAI();
          return;
        }
        
        toast({
          title: `Speech Recognition Error: ${event.error}`,
          description: "Falling back to alternative transcription",
          variant: "destructive",
        });
        
        fallbackToOpenAI();
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        // Only set isRecording to false if we're not transitioning to fallback
        if (!isFallbackActive) {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Failed to start native speech recognition:', error);
      return false;
    }
  }, [fallbackToOpenAI, nativeSpeechFailed, onTranscriptionComplete, toast, isFallbackActive]);

  const startRecording = useCallback(async () => {
    console.log('🎤 Starting recording...');
    
    // Reset state before starting
    setIsFallbackActive(false);
    
    // Try native speech recognition first
    if (startNativeRecording()) {
      return;
    }

    // Fall back to OpenAI implementation
    await fallbackToOpenAI();
  }, [fallbackToOpenAI, startNativeRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
