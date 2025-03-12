
import { useRef, useCallback } from 'react';
import { getAverageVolume, SILENCE_THRESHOLD, SILENCE_TIMEOUT } from './audioUtils';

/**
 * Custom hook for detecting silence in audio input
 * Used to automatically stop recording when the user stops speaking
 */
export const useSilenceDetection = (onSilenceDetected: () => void) => {
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Checks the current audio volume and triggers silence detection
   */
  const checkVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const average = getAverageVolume(analyserRef.current);
    
    if (average < SILENCE_THRESHOLD) {
      // If volume is below threshold and no timeout is set, start one
      if (!silenceTimeoutRef.current) {
        console.log(`Sound level (${average.toFixed(2)}) below threshold (${SILENCE_THRESHOLD}), starting silence timer`);
        silenceTimeoutRef.current = setTimeout(() => {
          console.log(`Silence detected for ${SILENCE_TIMEOUT}ms, stopping recording`);
          onSilenceDetected();
        }, SILENCE_TIMEOUT);
      }
    } else if (silenceTimeoutRef.current) {
      // If volume is above threshold and timeout exists, clear it
      console.log(`Sound detected (${average.toFixed(2)}), resetting silence timer`);
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Continue checking volume in the next animation frame
    animationFrameRef.current = requestAnimationFrame(checkVolume);
  }, [onSilenceDetected]);

  /**
   * Starts silence detection with the given audio analyzer
   */
  const startSilenceDetection = useCallback((analyser: AnalyserNode) => {
    console.log('Starting silence detection');
    analyserRef.current = analyser;
    // Clean up any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Start the volume checking loop
    animationFrameRef.current = requestAnimationFrame(checkVolume);
  }, [checkVolume]);

  /**
   * Stops silence detection and cleans up resources
   */
  const stopSilenceDetection = useCallback(() => {
    console.log('Stopping silence detection');
    // Clear timeout if it exists
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Cancel animation frame if it exists
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clear analyser reference
    analyserRef.current = null;
  }, []);

  return {
    startSilenceDetection,
    stopSilenceDetection
  };
};
