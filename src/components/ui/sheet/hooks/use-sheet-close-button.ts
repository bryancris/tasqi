
import { useCallback } from 'react';

interface UseSheetCloseButtonProps {
  sheetId: string;
}

/**
 * Hook to handle sheet close button interactions
 * This hook is now only responsible for tracking the click event
 * The actual closing logic has been moved to useSheetCloseHandler
 */
export function useSheetCloseButton({ sheetId }: UseSheetCloseButtonProps) {
  // Handle close button click - this now only records the event
  // The actual closing happens in useSheetCloseHandler
  const handleCloseClick = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    console.log(`Sheet ${sheetId} close button clicked - tracking event`);
    
    // Set tracking data for debugging
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();
    (window as any).__closeButtonSheetId = sheetId;
  }, [sheetId]);
  
  return { handleCloseClick };
}
