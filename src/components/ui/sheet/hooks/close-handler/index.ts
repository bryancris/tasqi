
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
    // First handle the basic close operations
    handleBasicClose(e);
    
    // Then apply iOS PWA specific protections if needed
    applyIOSPWAProtections(e);
  }, [handleBasicClose, applyIOSPWAProtections]);

  return { enhancedCloseHandler };
}
