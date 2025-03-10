
import { useRef, useState, useCallback } from 'react';

/**
 * Hook to manage the sheet lifecycle states
 * Tracks opening, closing, and animation states
 */
export function useSheetLifecycle() {
  // Generate a unique ID for this sheet instance
  const sheetId = useRef<string>(`sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`).current;
  
  // Track if the sheet is currently closing
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);
  
  // Handle animation start events
  const handleAnimationStart = useCallback((e: React.AnimationEvent) => {
    // Check if this is a closing animation
    if (e.animationName.includes('out-to')) {
      setIsClosing(true);
      isClosingRef.current = true;
      
      console.log(`Sheet ${sheetId} closing animation started`);
    }
  }, [sheetId]);
  
  // Handle animation end events
  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    // Reset closing state when animation ends
    if (e.animationName.includes('out-to')) {
      setIsClosing(false);
      isClosingRef.current = false;
      
      console.log(`Sheet ${sheetId} closing animation completed`);
    }
  }, [sheetId]);
  
  return {
    sheetId,
    isClosing,
    isClosingRef,
    handleAnimationStart,
    handleAnimationEnd
  };
}
