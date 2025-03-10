
import * as React from "react";

// Type definition to properly handle both mouse and touch events
export type CombinedEvent = React.MouseEvent<Element> | React.TouchEvent<Element>;

interface UseCoreCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  onOpenChange?: (open: boolean) => void;
  handleCloseClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
}

/**
 * Core hook for handling sheet close events
 * Manages basic event handling and cleanup
 */
export function useCoreCloseHandler({
  isSharingSheet,
  sheetId,
  onOpenChange,
  handleCloseClick
}: UseCoreCloseHandlerProps) {
  // Basic close handler that handles prevention of event propagation
  const handleBasicClose = React.useCallback((e: CombinedEvent) => {
    console.log(`📱 Sheet close button ${e.type} (sharing: ${isSharingSheet})`);

    // Prevent default and stop propagation
    e.stopPropagation();
    e.preventDefault();

    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      e.nativeEvent.preventDefault();
      
      if ('stopImmediatePropagation' in e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
    }

    // Set global flags for tracking sheet closure
    if (isSharingSheet) {
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      (window as any).__lastSheetCloseId = `${sheetId}-${Date.now()}`;
    }

    // Manually trigger the onOpenChange callback to close the sheet
    if (onOpenChange) {
      setTimeout(() => {
        console.log("Closing sheet via onOpenChange");
        onOpenChange(false);
      }, 0);
    }

    // Handle the mouse click event if a handler was provided
    if (handleCloseClick && 'button' in e) {
      handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
    }
  }, [handleCloseClick, isSharingSheet, sheetId, onOpenChange]);

  return {
    handleBasicClose
  };
}
