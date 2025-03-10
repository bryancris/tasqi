
import * as React from "react";
import { useCoreCloseHandler, CombinedEvent } from "./use-core-close-handler";
import { useIOSPWAEnhancements } from "./use-ios-pwa-enhancements";

// Re-export the type for external use
export type { CombinedEvent };

interface UseSheetCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Main hook that combines core close handling with iOS PWA enhancements
 * This is kept for backward compatibility but is no longer the primary close handler
 */
export function useSheetCloseHandler({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: UseSheetCloseHandlerProps) {
  // Use the core close handler for basic event handling
  const { handleBasicClose } = useCoreCloseHandler({
    isSharingSheet,
    sheetId,
    onOpenChange,
    handleCloseClick
  });

  // Use iOS PWA specific enhancements
  const { isIOSPwaApp, applyIOSPWAProtections } = useIOSPWAEnhancements({
    isSharingSheet,
    sheetId
  });

  // Enhanced close handler that combines both approaches
  const enhancedCloseHandler = React.useCallback((e: CombinedEvent) => {
    console.log(`[Legacy] Sheet ${sheetId} close button triggered via ${e.type}`);
    
    // First handle the basic close operations
    handleBasicClose(e);
    
    // Then apply iOS PWA specific protections if needed
    applyIOSPWAProtections(e);
    
    // Directly call onOpenChange to ensure the sheet closes
    if (onOpenChange) {
      setTimeout(() => {
        try {
          onOpenChange(false);
        } catch (err) {
          console.error('Error in legacy close handler:', err);
        }
      }, 10);
    }
  }, [handleBasicClose, applyIOSPWAProtections, sheetId, onOpenChange]);

  return { enhancedCloseHandler };
}
