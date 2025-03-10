
import * as React from "react";
import { isIOSPWA, markSharingSheetClosing, addShieldOverlay } from "@/utils/platform-detection";
import type { CombinedEvent } from "./use-core-close-handler";

interface UseIOSPWAEnhancementsProps {
  isSharingSheet: boolean;
  sheetId: string;
}

/**
 * Hook providing iOS PWA specific enhancements for sheet closing
 * Handles specific behaviors needed for iOS PWA environment
 */
export function useIOSPWAEnhancements({
  isSharingSheet,
  sheetId
}: UseIOSPWAEnhancementsProps) {
  const isIOSPwaApp = isIOSPWA();
  
  // Apply iOS PWA specific protections
  const applyIOSPWAProtections = React.useCallback((e: CombinedEvent) => {
    // Set timestamp when the close button was pressed
    (window as any).__closeButtonPressed = true;
    (window as any).__closeButtonPressTime = Date.now();
    
    // Mark sharing sheet as closing with all protective measures
    if (isSharingSheet) {
      console.log("📱 Sharing sheet closing via close button - adding protection");
      
      markSharingSheetClosing(sheetId);
      
      if (isIOSPwaApp) {
        // Add shield overlay on iOS PWA for sharing sheet
        addShieldOverlay(6000);
      }
    }
  }, [isIOSPwaApp, isSharingSheet, sheetId]);
  
  return {
    isIOSPwaApp,
    applyIOSPWAProtections
  };
}
