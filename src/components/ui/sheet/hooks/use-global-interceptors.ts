
import * as React from "react";
import { SheetRegistry } from "../sheet-utils";
import { isIOSPWA } from "@/utils/platform-detection";

/**
 * Hook to add global event interceptors for iOS PWA and sharing sheets
 */
export function useGlobalInterceptors() {
  const isIOSPwaApp = isIOSPWA();
  
  // Set up a global click interceptor to prevent clicks right after closing
  React.useEffect(() => {
    const interceptGlobalClicks = (e: MouseEvent) => {
      if (SheetRegistry.isClosingSharingSheet()) {
        // If we're in a closing state, find if the event target is related to sharing
        if (e.target instanceof HTMLElement) {
          // Check entire path for sharing-related elements
          const path = e.composedPath();
          const hasSharingRelated = path.some(el => 
            el instanceof HTMLElement && 
            (el.closest('[data-sharing-indicator]') || 
             el.closest('[data-sharing-sheet-id]') ||
             el.hasAttribute('data-sharing-indicator') ||
             el.hasAttribute('data-sharing-sheet-id'))
          );
          
          if (hasSharingRelated) {
            console.log("Intercepting click during sheet closing - sharing related");
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
        }
      }
    };
    
    // Use capture phase to intercept before other handlers
    document.addEventListener('click', interceptGlobalClicks, { capture: true });
    
    // For iOS PWA, also intercept touchstart events which can trigger drawer opening
    if (isIOSPwaApp) {
      const interceptTouchStart = (e: TouchEvent) => {
        if (SheetRegistry.isClosingSharingSheet()) {
          // Only for task card interactions
          if (e.target instanceof HTMLElement) {
            const isTaskCard = e.target.closest('[role="button"]') && 
                             !e.target.closest('button') && 
                             !e.target.closest('[data-radix-dialog-close]');
                             
            if (isTaskCard) {
              console.log("Intercepting touchstart during sheet closing on task card");
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        }
      };
      
      document.addEventListener('touchstart', interceptTouchStart, { 
        capture: true,
        passive: false
      });
      
      return () => {
        document.removeEventListener('click', interceptGlobalClicks, { capture: true });
        document.removeEventListener('touchstart', interceptTouchStart, { capture: true });
      };
    }
    
    return () => {
      document.removeEventListener('click', interceptGlobalClicks, { capture: true });
    };
  }, [isIOSPwaApp]);
}
