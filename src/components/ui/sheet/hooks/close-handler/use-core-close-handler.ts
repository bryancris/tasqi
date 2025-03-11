
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
 * Simplified for reliability
 */
export function useCoreCloseHandler({
  isSharingSheet,
  sheetId,
  onOpenChange,
  handleCloseClick
}: UseCoreCloseHandlerProps) {
  // Direct close handler that prioritizes sheet closing
  const handleBasicClose = React.useCallback((e: CombinedEvent) => {
    console.log(`🔴 Sheet ${sheetId} core close handler triggered via ${e.type}`);

    // Prevent event propagation
    e.stopPropagation();
    e.preventDefault();

    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      e.nativeEvent.preventDefault();
    }

    // Set flags for debugging
    (window as any).__isClosingSheet = true;
    (window as any).__sheetCloseTime = Date.now();
    (window as any).__lastSheetCloseId = `${sheetId}-${Date.now()}`;

    // Call tracking handler
    if (handleCloseClick && 'button' in e) {
      try {
        handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
      } catch (err) {
        console.error('Error in click tracking:', err);
      }
    }

    // The most important part - directly close the sheet with multiple fallback approaches
    if (onOpenChange) {
      // Log the close attempt
      console.log(`🔴 Directly closing sheet ${sheetId} via onOpenChange(false)`);
      
      // 1. Try immediate close first
      try {
        onOpenChange(false);
      } catch (err) {
        console.error('Error in immediate close:', err);
      }
      
      // 2. Use setTimeout as first fallback
      setTimeout(() => {
        try {
          if (onOpenChange) onOpenChange(false);
        } catch (err) {
          console.error('Error in first delayed close:', err);
        }
      }, 0);
      
      // 3. Use a slightly longer timeout as final fallback
      setTimeout(() => {
        try {
          if (onOpenChange) onOpenChange(false);
        } catch (err) {
          console.error('Error in final fallback close:', err);
        }
      }, 50);
    } else {
      console.error(`❌ No onOpenChange provided for sheet ${sheetId}`);
    }
  }, [handleCloseClick, isSharingSheet, sheetId, onOpenChange]);

  return {
    handleBasicClose
  };
}
