
import { useCallback } from 'react';
import { CombinedEvent } from './close-handler';

interface UseSheetCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Hook to handle sheet close button interactions
 */
export function useSheetCloseHandler({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: UseSheetCloseHandlerProps) {
  // Enhanced handler that combines click handling with closing the sheet
  const enhancedCloseHandler = useCallback((e: CombinedEvent) => {
    console.log(`Sheet ${sheetId} close button clicked/touched`);
    
    // Prevent default and stop propagation
    e.stopPropagation();
    e.preventDefault();

    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      e.nativeEvent.preventDefault();
    }

    // Call the original click handler
    if (handleCloseClick && 'button' in e) {
      handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
    }

    // Set timestamp when the close button was pressed (for debugging)
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();
    
    // Close the sheet by calling onOpenChange with false
    if (onOpenChange) {
      setTimeout(() => {
        onOpenChange(false);
      }, 10);
    }
  }, [handleCloseClick, sheetId, onOpenChange, isSharingSheet]);
  
  return { enhancedCloseHandler };
}
