
import { useRef, useEffect, useCallback } from "react";
import { 
  generateSheetId, 
  addEventBlockers, 
  isSpecialElement, 
  isPopoverElement,
  isSharingRelated,
  SheetRegistry 
} from "./sheet-utils";
import { isIOSPWA } from "@/utils/platform-detection";
import * as SheetPrimitive from "@radix-ui/react-dialog";

// Define proper types for Radix events
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface UseSheetInteractionsProps {
  side: "top" | "right" | "bottom" | "left";
  onPointerDownOutside?: (e: PointerDownOutsideEvent) => void;
  onCloseAutoFocus?: (e: Event) => void;
}

export function useSheetInteractions({
  side,
  onPointerDownOutside,
  onCloseAutoFocus
}: UseSheetInteractionsProps) {
  // Create refs to track state
  const isClosingRef = useRef(false);
  const sheetIdRef = useRef<string>(generateSheetId());
  
  // Check if running on iOS PWA for platform-specific behavior
  const isIOSPwaApp = isIOSPWA();
  
  // Register this sheet when mounted
  useEffect(() => {
    SheetRegistry.registerSheet(sheetIdRef.current);
    
    // Set up a global click interceptor to prevent clicks right after closing
    const interceptGlobalClicks = (e: MouseEvent) => {
      if (isClosingRef.current || SheetRegistry.isClosingSharingSheet()) {
        // If we're in a closing state, find if the event target is related to sharing
        if (e.target instanceof HTMLElement) {
          // Check entire path for sharing-related elements
          const path = e.composedPath();
          const hasSharingRelated = path.some(el => 
            el instanceof HTMLElement && isSharingRelated(el)
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
        if (isClosingRef.current || SheetRegistry.isClosingSharingSheet()) {
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
        SheetRegistry.unregisterSheet(sheetIdRef.current);
        document.removeEventListener('click', interceptGlobalClicks, { capture: true });
        document.removeEventListener('touchstart', interceptTouchStart, { capture: true });
      };
    }
    
    return () => {
      SheetRegistry.unregisterSheet(sheetIdRef.current);
      document.removeEventListener('click', interceptGlobalClicks, { capture: true });
    };
  }, [isIOSPwaApp]);
  
  // Custom handlers for component props
  const handlePointerDownOutside = useCallback((event: PointerDownOutsideEvent) => {
    // Mark that we're closing the sheet
    isClosingRef.current = true;
    
    // Check for sharing-related interactions
    const target = event.target as HTMLElement;
    const originalTarget = event.detail.originalEvent.target as HTMLElement;
    
    if (isSharingRelated(originalTarget)) {
      // Mark this as a sharing sheet interaction
      SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
      
      // Block duration longer for iOS PWA
      const blockDuration = isIOSPwaApp ? 1500 : 800;
      
      // Block all events immediately
      addEventBlockers(blockDuration, () => {
        isClosingRef.current = false;
      });
      
      // Prevent the default closing behavior for sharing-related interactions
      event.preventDefault();
      return;
    }
    
    // Prevent closing the sheet when clicking on special elements
    if (isSpecialElement(originalTarget) || isPopoverElement(originalTarget)) {
      console.log("Preventing sheet close due to special element interaction");
      event.preventDefault();
      return;
    }
    
    // Call original handler if provided
    if (onPointerDownOutside) {
      onPointerDownOutside(event);
    }
  }, [onPointerDownOutside, isIOSPwaApp]);
  
  const handleCloseAutoFocus = useCallback((event: Event) => {
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
  
  const handleAnimationStart = useCallback((e: React.AnimationEvent) => {
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
  
  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
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
  
  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    // When closing via the X button, ensure we block propagation
    if (e.target instanceof HTMLElement) {
      const sharingElement = e.target.closest('[data-sharing-sheet-id]') || 
                             document.querySelector('[data-sharing-sheet-id]');
                             
      if (sharingElement) {
        // Mark this as a sharing sheet close
        SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
        
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
  }, [isIOSPwaApp]);
  
  return {
    sheetId: sheetIdRef.current,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  };
}
