
import { useCallback } from 'react';

interface UseSheetCloseButtonProps {
  sheetId: string;
}

/**
 * Hook to handle sheet close button interactions
 */
export function useSheetCloseButton({ sheetId }: UseSheetCloseButtonProps) {
  // Handle close button click
  const handleCloseClick = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    // Set timestamp when the close button was pressed
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();
    
    console.log(`Sheet ${sheetId} close button clicked`);
    
    // This function now only handles the click event recording
    // The actual closing is handled by the enhanced handler in useSheetCloseHandler
  }, [sheetId]);
  
  return { handleCloseClick };
}
