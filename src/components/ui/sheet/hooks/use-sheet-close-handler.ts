
import { useCallback } from 'react';
import { CombinedEvent } from './close-handler';

interface UseSheetCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Simplified hook to handle sheet close button interactions
 */
export function useSheetCloseHandler({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: UseSheetCloseHandlerProps) {
  // Direct handler that prioritizes closing the sheet
  const enhancedCloseHandler = useCallback((e: CombinedEvent) => {
    console.log(`Sheet ${sheetId} direct close handler triggered via ${e.type}`);
    
    // Prevent default and stop propagation
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    // Track for debugging
    (window as any).__closeHandlerTriggered = true;
    (window as any).__closeHandlerTime = Date.now();
    (window as any).__closeEventType = e.type;
    
    // Call original handler for tracking
    if (handleCloseClick && ('button' in e)) {
      try {
        handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
      } catch (err) {
        console.error('Error in click handler:', err);
      }
    }

    // MOST IMPORTANT: Actually close the sheet
    if (onOpenChange) {
      console.log(`Directly closing sheet ${sheetId} via onOpenChange(false)`);
      
      // Small timeout to ensure reliability
      setTimeout(() => {
        try {
          onOpenChange(false);
        } catch (err) {
          console.error('Error closing sheet:', err);
        }
      }, 0);
    } else {
      console.warn(`Cannot close sheet ${sheetId}: onOpenChange not provided`);
    }
  }, [handleCloseClick, sheetId, onOpenChange, isSharingSheet]);
  
  return { enhancedCloseHandler };
}
