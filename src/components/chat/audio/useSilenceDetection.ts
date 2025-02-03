import { useRef, useCallback } from 'react';
import { SILENCE_THRESHOLD, SILENCE_TIMEOUT, getAverageVolume } from './audioUtils';

export const useSilenceDetection = (onSilenceDetected: () => void) => {
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const checkVolume = useCallback(() => {
    if (!analyserRef.current) return;

    const average = getAverageVolume(analyserRef.current);

    if (average < SILENCE_THRESHOLD) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          onSilenceDetected();
        }, SILENCE_TIMEOUT);
      }
    } else if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    requestAnimationFrame(checkVolume);
  }, [onSilenceDetected]);

  const startSilenceDetection = useCallback((analyser: AnalyserNode) => {
    analyserRef.current = analyser;
    checkVolume();
  }, [checkVolume]);

  const stopSilenceDetection = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  return {
    startSilenceDetection,
    stopSilenceDetection
  };
};