
import * as React from "react";
import { SheetRegistry, addEventBlockers } from "../sheet-utils";
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection";

export type CloseButtonEvent = React.MouseEvent<Element, MouseEvent>;

/**
 * Hook to handle close button interactions
 */
export function useSheetCloseButton({
  sheetId,
  isSharingSheet = false
}: {
  sheetId: string;
  isSharingSheet?: boolean;
}) {
  const isIOSPwaApp = isIOSPWA();
  
  const handleCloseClick = React.useCallback((e: CloseButtonEvent) => {
    // When closing via the X button, ensure we block propagation
    if (e.target instanceof HTMLElement) {
      const sharingElement = e.target.closest('[data-sharing-sheet-id]') || 
                             document.querySelector('[data-sharing-sheet-id]');
                             
      if (sharingElement) {
        // Mark this as a sharing sheet close
        SheetRegistry.markClosingSharingSheet(sheetId);
        
        // Block duration longer for iOS PWA
        const blockDuration = isIOSPwaApp ? 1500 : 800;
        
        // Add aggressive event blocking
        addEventBlockers(blockDuration);
        
        // Stop propagation immediately
        e.stopPropagation();
        e.preventDefault();
        
        // For iOS PWA, add an extra shield element to block all interactions
        if (isIOSPwaApp) {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.right = '0';
          overlay.style.bottom = '0';
          overlay.style.zIndex = '998';
          overlay.style.backgroundColor = 'transparent';
          overlay.setAttribute('data-sharing-shield', 'true');
          document.body.appendChild(overlay);
          
          // Remove the shield after animation completes
          setTimeout(() => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          }, 800);
        }
      }
    }
  }, [isIOSPwaApp, sheetId]);

  return { handleCloseClick };
}
