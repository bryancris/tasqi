
import { useCallback } from 'react';
import { CombinedEvent } from './close-handler';

interface UseSheetCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Hook to handle sheet close button interactions with proper mobile support
 */
export function useSheetCloseHandler({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: UseSheetCloseHandlerProps) {
  // Enhanced handler that works on both touch and mouse events
  const enhancedCloseHandler = useCallback((e: CombinedEvent) => {
    console.log(`Sheet ${sheetId} close handler triggered via ${e.type}`);
    
    // Prevent default and stop propagation - but don't block the sheet closing
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();

    // Mark that we're handling this event to help with debugging
    (window as any).__closeHandlerTriggered = true;
    (window as any).__closeHandlerTime = Date.now();
    (window as any).__closeEventType = e.type;
    
    // Call the original click handler to maintain analytics/tracking
    if (handleCloseClick && ('button' in e || e.type.includes('touch'))) {
      try {
        // Call with the event if it's a mouse event, otherwise create a synthetic one
        if ('button' in e) {
          handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
        } else {
          // For touch events, we create a synthetic mouse event for compatibility
          const syntheticEvent = {
            ...e,
            button: 0,
            preventDefault: () => {},
            stopPropagation: () => {}
          } as unknown as React.MouseEvent<Element, MouseEvent>;
          
          handleCloseClick(syntheticEvent);
        }
      } catch (err) {
        console.error('Error in click handler:', err);
      }
    }

    // The most important part: Actually close the sheet!
    // Use setTimeout to ensure this runs after the current event loop
    if (onOpenChange) {
      console.log(`Closing sheet ${sheetId} via onOpenChange`);
      
      // Use a shorter timeout (10ms) to make it feel more responsive
      setTimeout(() => {
        try {
          onOpenChange(false);
        } catch (err) {
          console.error('Error closing sheet:', err);
        }
      }, 10);
    } else {
      console.warn(`Cannot close sheet ${sheetId}: onOpenChange not provided`);
    }
  }, [handleCloseClick, sheetId, onOpenChange, isSharingSheet]);
  
  return { enhancedCloseHandler };
}
