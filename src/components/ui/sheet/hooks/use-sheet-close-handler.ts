
import * as React from "react";
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection";

// Type definition to properly handle both mouse and touch events
export type CombinedEvent = React.MouseEvent<Element> | React.TouchEvent<Element>;

interface UseSheetCloseHandlerProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

export function useSheetCloseHandler({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: UseSheetCloseHandlerProps) {
  const isIOSPwaApp = isIOSPWA();

  // Enhanced close handler that works better for iOS PWA
  const enhancedCloseHandler = React.useCallback((e: CombinedEvent) => {
    console.log(`📱 Sheet close button ${e.type} (sharing: ${isSharingSheet}, iOS PWA: ${isIOSPwaApp})`);

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

    if (isSharingSheet) {
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      (window as any).__lastSheetCloseId = `${sheetId}-${Date.now()}`;
    }

    // For iOS PWA, add more aggressive protection
    if (isSharingSheet && isIOSPwaApp) {
      console.log(`📱 iOS PWA: Adding special close button protection`);

      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();
      (window as any).__closeButtonPressed = true;
      (window as any).__closeButtonPressTime = Date.now();

      // Add an empty timeout to force the event loop to process the current events
      setTimeout(() => {
        console.log("🔄 iOS PWA: Processing close button press...");
        
        // Manually trigger the onOpenChange callback after a small delay
        // to ensure this event completes first
        setTimeout(() => {
          if (onOpenChange) {
            console.log("🔄 iOS PWA: Manually closing sheet via onOpenChange");
            onOpenChange(false);
          }
        }, 50);
      }, 0);

      addShieldOverlay(6000);

      const blockTaskCardEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]') ||
                        evt.target.closest('[role="button"]');

          const isControl = evt.target.closest('[data-sheet-close]') ||
                       evt.target.closest('button') ||
                       evt.target.closest('[data-radix-dialog-close]');

          if (isTaskCard && !isControl) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };

      // Use both capture and bubble phase for maximum protection
      document.addEventListener('click', blockTaskCardEvents, { capture: true });
      document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
      document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });

      setTimeout(() => {
        document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
      }, 4000);

      setTimeout(() => {
        document.removeEventListener('click', blockTaskCardEvents, { capture: true });
      }, 6000);
    }

    // Pass the event to handleCloseClick only if it's a mouse event
    if (handleCloseClick && 'button' in e) {
      handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
    }
  }, [handleCloseClick, isSharingSheet, isIOSPwaApp, sheetId, onOpenChange]);

  return { enhancedCloseHandler };
}
