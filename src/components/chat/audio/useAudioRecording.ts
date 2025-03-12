
import { useState, useRef, useCallback } from 'react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { useSilenceDetection } from './useSilenceDetection';
import { createAudioAnalyser, getAudioMimeType } from './audioUtils';
import { useToast } from '@/hooks/use-toast';

type SpeechRecognitionInstance = InstanceType<typeof SpeechRecognition>;

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { requestMicrophoneAccess } = useMicrophoneAccess();
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [nativeSpeechFailed, setNativeSpeechFailed] = useState(false);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const { startSilenceDetection, stopSilenceDetection } = useSilenceDetection(stopRecording);

  // Function to fallback to OpenAI transcription
  const fallbackToOpenAI = useCallback(async () => {
    console.log('⚠️ Falling back to OpenAI transcription');
    setNativeSpeechFailed(true);
    
    // Stop existing recognition if running
    if (recognitionRef.current) {
      try {
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
    }
  }, [onTranscriptionComplete, requestMicrophoneAccess, startSilenceDetection, stopSilenceDetection, toast]);

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

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.log('Speech recognition timeout after 10 seconds');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.error('Error stopping timed out speech recognition:', e);
          }
          fallbackToOpenAI();
        }
      }, 10000);

      recognition.onresult = (event) => {
        clearTimeout(timeoutId);
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        onTranscriptionComplete(transcript);
      };

      recognition.onerror = (event) => {
        clearTimeout(timeoutId);
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
        clearTimeout(timeoutId);
        console.log('Speech recognition ended');
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
  }, [fallbackToOpenAI, nativeSpeechFailed, onTranscriptionComplete, toast]);

  const startRecording = useCallback(async () => {
    console.log('🎤 Starting recording...');
    
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
