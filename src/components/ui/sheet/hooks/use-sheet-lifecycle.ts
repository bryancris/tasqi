
import * as React from "react";
import { generateSheetId, SheetRegistry } from "../sheet-utils";
import { isIOSPWA } from "@/utils/platform-detection";

/**
 * Hook to handle sheet lifecycle events (mounting, unmounting, animation)
 */
export function useSheetLifecycle(isSharingSheet: boolean = false) {
  // Create refs to track state
  const isClosingRef = React.useRef(false);
  const sheetIdRef = React.useRef<string>(generateSheetId());
  
  // Check if running on iOS PWA for platform-specific behavior
  const isIOSPwaApp = isIOSPWA();
  
  // Register this sheet when mounted
  React.useEffect(() => {
    SheetRegistry.registerSheet(sheetIdRef.current);
    
    return () => {
      SheetRegistry.unregisterSheet(sheetIdRef.current);
    };
  }, []);
  
  const handleAnimationStart = React.useCallback((e: React.AnimationEvent) => {
    // If this is a closing animation starting
    if (e.animationName.includes('out') || e.animationName.includes('close')) {
      isClosingRef.current = true;
      
      // If it's a sharing-related sheet, add extra protection
      if (document.querySelector('[data-sharing-sheet-id]')) {
        SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
        
        // Add a global click blocker immediately
        const blockClickEvents = (evt: MouseEvent) => {
          evt.stopPropagation();
          evt.preventDefault();
          return false;
        };
        
        document.addEventListener('click', blockClickEvents, { capture: true });
        
        // Block duration longer for iOS PWA
        const blockDuration = isIOSPwaApp ? 1500 : 800;
        
        // Remove after delay
        setTimeout(() => {
          document.removeEventListener('click', blockClickEvents, { capture: true });
        }, blockDuration);
      }
    }
  }, [isIOSPwaApp]);
  
  const handleAnimationEnd = React.useCallback((e: React.AnimationEvent) => {
    // Check if this is the closing animation ending
    if (e.animationName.includes('out') || e.animationName.includes('close')) {
      // Block duration longer for iOS PWA (delay setting isClosingRef to false)
      const safetyDelay = isIOSPwaApp ? 800 : 500;
      
      // Add safety delay before allowing other interactions
      setTimeout(() => {
        isClosingRef.current = false;
      }, safetyDelay);
      
      // If this is a closing animation, add an event blocker
      const blockClickEvents = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();
        document.removeEventListener('click', blockClickEvents, { capture: true });
      };
      
      document.addEventListener('click', blockClickEvents, { 
        capture: true, 
        once: true 
      });
      
      // For iOS PWA, also block touchstart 
      if (isIOSPwaApp) {
        const blockTouchEvents = (evt: TouchEvent) => {
          // Only block task card interactions
          if (evt.target instanceof HTMLElement) {
            const isTaskCard = evt.target.closest('[role="button"]') && 
                             !evt.target.closest('button') && 
                             !evt.target.closest('[data-radix-dialog-close]');
                             
            if (isTaskCard) {
              evt.preventDefault();
              evt.stopPropagation();
            }
          }
        };
        
        document.addEventListener('touchstart', blockTouchEvents, {
          capture: true,
          passive: false
        });
        
        setTimeout(() => {
          document.removeEventListener('touchstart', blockTouchEvents, { capture: true });
        }, 800);
      }
    }
  }, [isIOSPwaApp]);

  return {
    sheetId: sheetIdRef.current,
    isClosingRef,
    handleAnimationStart,
    handleAnimationEnd
  };
}
