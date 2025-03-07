
import { useRef, useEffect, useCallback } from "react";
import { 
  generateSheetId, 
  addEventBlockers, 
  isSpecialElement, 
  isPopoverElement,
  isSharingRelated,
  SheetRegistry 
} from "./sheet-utils";
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
    
    return () => {
      SheetRegistry.unregisterSheet(sheetIdRef.current);
      document.removeEventListener('click', interceptGlobalClicks, { capture: true });
    };
  }, []);
  
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
      
      // Block all events immediately
      addEventBlockers(800, () => {
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
  }, [onPointerDownOutside]);
  
  const handleCloseAutoFocus = useCallback((event: Event) => {
    // Prevent auto-focus behavior which can trigger unwanted interactions
    event.preventDefault();
    
    // If this is a sharing-related closure, enforce stricter blocking
    if (SheetRegistry.isClosingSharingSheet()) {
      console.log("Adding extra event blockers for sharing sheet close");
      addEventBlockers(800);
    }
    
    if (onCloseAutoFocus) onCloseAutoFocus(event);
  }, [onCloseAutoFocus]);
  
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
        
        // Remove after delay
        setTimeout(() => {
          document.removeEventListener('click', blockClickEvents, { capture: true });
        }, 800);
      }
    }
  }, []);
  
  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    // Check if this is the closing animation ending
    if (e.animationName.includes('out') || e.animationName.includes('close')) {
      // Add safety delay before allowing other interactions
      setTimeout(() => {
        isClosingRef.current = false;
      }, 500);
      
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
    }
  }, []);
  
  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    // When closing via the X button, ensure we block propagation
    if (e.target instanceof HTMLElement) {
      const sharingElement = e.target.closest('[data-sharing-sheet-id]') || 
                             document.querySelector('[data-sharing-sheet-id]');
                             
      if (sharingElement) {
        // Mark this as a sharing sheet close
        SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
        
        // Add aggressive event blocking
        addEventBlockers(800);
        
        // Stop propagation immediately
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }, []);
  
  return {
    sheetId: sheetIdRef.current,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  };
}
