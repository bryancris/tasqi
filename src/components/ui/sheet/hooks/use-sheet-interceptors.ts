
import * as React from "react";
import { addEventBlockers, isSpecialElement, isPopoverElement, isSharingRelated } from "../sheet-utils";
import { SheetRegistry } from "../sheet-utils";
import { isIOSPWA } from "@/utils/platform-detection";

// Define proper types for Radix events
export type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

/**
 * Hook to handle event interception including pointer events outside,
 * auto-focus, and closing clicks
 */
export function useSheetInterceptors({
  sheetId,
  isClosingRef,
  onPointerDownOutside,
  onCloseAutoFocus
}: {
  sheetId: string;
  isClosingRef: React.RefObject<boolean>;
  onPointerDownOutside?: (e: PointerDownOutsideEvent) => void;
  onCloseAutoFocus?: (e: Event) => void;
}) {
  // Check if running on iOS PWA for platform-specific behavior
  const isIOSPwaApp = isIOSPWA();
  
  // Create a local state to track closing state
  const [isClosing, setIsClosing] = React.useState(false);
  
  // Handle external pointer events (clicks outside the sheet)
  const handlePointerDownOutside = React.useCallback((event: PointerDownOutsideEvent) => {
    // Check if already closing
    if (isClosingRef.current || isClosing) return;
    
    // Update local closing state
    setIsClosing(true);
    
    // Check for sharing-related interactions
    const target = event.target as HTMLElement;
    const originalTarget = event.detail.originalEvent.target as HTMLElement;
    
    if (isSharingRelated(originalTarget)) {
      // Mark this as a sharing sheet interaction
      SheetRegistry.markClosingSharingSheet(sheetId);
      
      // Block duration longer for iOS PWA
      const blockDuration = isIOSPwaApp ? 1500 : 800;
      
      // Block all events immediately
      addEventBlockers(blockDuration, () => {
        setIsClosing(false);
      });
      
      // Prevent the default closing behavior for sharing-related interactions
      event.preventDefault();
      return;
    }
    
    // Prevent closing the sheet when clicking on special elements
    if (isSpecialElement(originalTarget) || isPopoverElement(originalTarget)) {
      console.log("Preventing sheet close due to special element interaction");
      event.preventDefault();
      setIsClosing(false);
      return;
    }
    
    // Call original handler if provided
    if (onPointerDownOutside) {
      onPointerDownOutside(event);
    }
  }, [onPointerDownOutside, isIOSPwaApp, sheetId, isClosingRef, isClosing]);
  
  // Handle auto-focus events when sheet is closing
  const handleCloseAutoFocus = React.useCallback((event: Event) => {
    // Prevent auto-focus behavior which can trigger unwanted interactions
    event.preventDefault();
    
    // If this is a sharing-related closure, enforce stricter blocking
    if (SheetRegistry.isClosingSharingSheet()) {
      console.log("Adding extra event blockers for sharing sheet close");
      // Block duration longer for iOS PWA
      const blockDuration = isIOSPwaApp ? 1500 : 800;
      addEventBlockers(blockDuration);
    }
    
    if (onCloseAutoFocus) onCloseAutoFocus(event);
  }, [onCloseAutoFocus, isIOSPwaApp]);
  
  return {
    handlePointerDownOutside,
    handleCloseAutoFocus,
    isClosing
  };
}
