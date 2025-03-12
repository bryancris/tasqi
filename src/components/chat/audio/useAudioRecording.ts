
import { useState, useCallback, useEffect } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useOpenAITranscription } from './useOpenAITranscription';

export function useAudioRecording(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [fallbackMode, setFallbackMode] = useState<'none' | 'pending' | 'active'>('none');
  
  // Initialize speech recognition hook
  const {
    isActive: isSpeechRecognitionActive,
    startSpeechRecognition,
    stopSpeechRecognition,
    speechRecognitionFailed
  } = useSpeechRecognition({
    onTranscriptionComplete,
    onError: (error) => {
      console.log(`Speech recognition error triggered fallback: ${error}`);
      setFallbackMode('pending');
    }
  });

  // Initialize OpenAI transcription hook
  const {
    isActive: isOpenAITranscriptionActive,
    startRecording: startOpenAITranscription,
    stopRecording: stopOpenAITranscription
  } = useOpenAITranscription(onTranscriptionComplete);

  // Update isRecording state based on both recording methods
  useEffect(() => {
    setIsRecording(isSpeechRecognitionActive || isOpenAITranscriptionActive);
  }, [isSpeechRecognitionActive, isOpenAITranscriptionActive]);

  // Handle fallback mode changes
  useEffect(() => {
    const handleFallback = async () => {
      if (fallbackMode === 'pending') {
        setFallbackMode('active');
        await startOpenAITranscription();
      }
    };

    handleFallback();
  }, [fallbackMode, startOpenAITranscription]);

  const startRecording = useCallback(async () => {
    console.log('🎤 Starting recording...');
    
    // Reset fallback state before starting
    setFallbackMode('none');
    
    // If speech recognition is already known to fail, go straight to OpenAI
    if (speechRecognitionFailed) {
      setFallbackMode('pending');
      return;
    }

    // Try native speech recognition first
    const speechRecognitionStarted = startSpeechRecognition();
    
    // If speech recognition failed to start, switch to OpenAI
    if (!speechRecognitionStarted) {
      setFallbackMode('pending');
    }
  }, [startSpeechRecognition, speechRecognitionFailed]);

  const stopRecording = useCallback(() => {
    // Stop both recording methods
    stopSpeechRecognition();
    stopOpenAITranscription();
    
    // Reset fallback mode
    setFallbackMode('none');
  }, [stopSpeechRecognition, stopOpenAITranscription]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
}
