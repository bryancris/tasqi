import { useState, useRef, useCallback } from 'react';
import { useMicrophoneAccess } from './useMicrophoneAccess';
import { useSilenceDetection } from './useSilenceDetection';
import { createAudioAnalyser, getAudioMimeType } from './audioUtils';

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { requestMicrophoneAccess } = useMicrophoneAccess();

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const { startSilenceDetection, stopSilenceDetection } = useSilenceDetection(stopRecording);

  const startRecording = useCallback(async () => {
    try {
      const stream = await requestMicrophoneAccess();
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
    }
  }, [onTranscriptionComplete, requestMicrophoneAccess, startSilenceDetection, stopSilenceDetection]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}