
import { useRef, useEffect, useCallback } from "react";
import { isIOSPWA, markSharingSheetClosing, addShieldOverlay } from "@/utils/platform-detection";

interface UseSharingSheetEffectsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function useSharingSheetEffects({ open, onOpenChange }: UseSharingSheetEffectsProps) {
  const uniqueIdRef = useRef<string>(`sharing-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const isIOSPwaApp = isIOSPWA();
  const previousOpenState = useRef(open);
  
  // Add iOS PWA specific styling classes when sheet is open
  useEffect(() => {
    if (isIOSPwaApp && open) {
      // Add a class to the body to enable additional CSS protection
      document.body.classList.add('ios-pwa-sharing-active');
      
      // Remove the class when the sheet closes or component unmounts
      return () => {
        document.body.classList.remove('ios-pwa-sharing-active');
      };
    }
  }, [isIOSPwaApp, open]);
  
  // Track when the sheet is transitioning from open to closed for extreme protection
  useEffect(() => {
    // Only run this when the sheet is closing (open changes from true to false)
    if (previousOpenState.current === true && open === false) {
      console.log("📱 Sharing sheet is closing - adding EXTREME protection");
      
      // Mark this sheet as closing with extended protection
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Add extreme protection for iOS PWA with a much longer duration
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Adding EXTREME protection for sharing sheet close");
        
        // Set extreme protection flags
        (window as any).__extremeProtectionActive = true;
        (window as any).__extremeProtectionStartTime = Date.now();
        
        // Add shield overlay with significantly longer duration
        addShieldOverlay(6000);
        
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            const isTaskCard = e.target.closest('.task-card') || 
                          e.target.closest('[data-task-card]') ||
                          e.target.closest('[role="button"]');
            
            // Allow close button and controls
            const isControl = e.target.closest('[data-sheet-close]') ||
                         e.target.closest('button') ||
                         e.target.closest('[data-radix-dialog-close]');
            
            if (isTaskCard && !isControl) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        };
        
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        }, 6000);
      }
    }
    
    // Update our ref for the next render
    previousOpenState.current = open;
  }, [open, isIOSPwaApp]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      console.log("Sharing sheet closing via onOpenChange");
      
      markSharingSheetClosing(uniqueIdRef.current);
      
      if (isIOSPwaApp) {
        // Add shield overlay with extended duration
        addShieldOverlay(6000);
        
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            const isTaskCard = e.target.closest('.task-card') || 
                          e.target.closest('[data-task-card]') ||
                          e.target.closest('[role="button"]');
            
            // Allow close button and controls
            const isControl = e.target.closest('[data-sheet-close]') ||
                         e.target.closest('button') ||
                         e.target.closest('[data-radix-dialog-close]');
            
            if (isTaskCard && !isControl) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        };
        
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        }, 6000);
      }
    }
    
    onOpenChange(newOpen);
  }, [onOpenChange, isIOSPwaApp]);

  return {
    uniqueIdRef,
    isIOSPwaApp,
    handleOpenChange
  };
}
