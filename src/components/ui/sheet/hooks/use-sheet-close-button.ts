
import { useCallback } from 'react';

interface UseSheetCloseButtonProps {
  sheetId: string;
}

/**
 * Hook to handle sheet close button interactions
 * This hook is now only responsible for tracking the click event
 * The actual closing logic has been moved to SheetCloseButton component directly
 */
export function useSheetCloseButton({ sheetId }: UseSheetCloseButtonProps) {
  // Handle close button click - this now only records the event
  const handleCloseClick = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    console.log(`Sheet ${sheetId} close button clicked - tracking event`);
    
    // Set tracking data for debugging
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();
    (window as any).__closeButtonSheetId = sheetId;
    
    // Add additional debug info
    (window as any).__closeButtonEvent = {
      type: e.type,
      target: e.target instanceof Element ? e.target.tagName : 'unknown',
      currentTarget: e.currentTarget instanceof Element ? e.currentTarget.tagName : 'unknown',
      timeStamp: e.timeStamp
    };
  }, [sheetId]);
  
  return { handleCloseClick };
}
