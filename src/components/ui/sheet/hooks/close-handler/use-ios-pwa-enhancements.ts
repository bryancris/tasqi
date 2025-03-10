
import * as React from "react";
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection";
import { CombinedEvent } from "./use-core-close-handler";

interface UseIOSPWAEnhancementsProps {
  isSharingSheet: boolean;
  sheetId: string;
}

/**
 * Hook that provides iOS PWA specific enhancements to close handling
 * Only applies the extra protections when running as an iOS PWA
 */
export function useIOSPWAEnhancements({
  isSharingSheet,
  sheetId
}: UseIOSPWAEnhancementsProps) {
  const isIOSPwaApp = isIOSPWA();

  // Add iOS PWA specific protections
  const applyIOSPWAProtections = React.useCallback((e: CombinedEvent) => {
    // Only apply these protections for sharing sheets on iOS PWA
    if (!isSharingSheet || !isIOSPwaApp) return;
    
    console.log(`📱 iOS PWA: Adding special close button protection`);

    // Set extreme protection flags
    (window as any).__extremeProtectionActive = true;
    (window as any).__extremeProtectionStartTime = Date.now();
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();

    // Add an overlay shield to block unwanted interactions
    addShieldOverlay(6000);

    // Block task card interactions
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

    // Add event listeners with capture to block events early
    document.addEventListener('click', blockTaskCardEvents, { capture: true });
    document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
    document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });

    // Cleanup timeouts with different durations for layered protection
    setTimeout(() => {
      document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
      document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
    }, 4000);

    setTimeout(() => {
      document.removeEventListener('click', blockTaskCardEvents, { capture: true });
    }, 6000);
  }, [isSharingSheet, isIOSPwaApp, sheetId]);

  return {
    isIOSPwaApp,
    applyIOSPWAProtections
  };
}
