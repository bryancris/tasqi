
import { useRef, useEffect } from "react";
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
    return () => {
      SheetRegistry.unregisterSheet(sheetIdRef.current);
    };
  }, []);
  
  // Handler for global clicks
  useEffect(() => {
    const handleGlobalClicks = (e: MouseEvent) => {
      // If this is a sharing indicator-related sheet being closed
      if (isClosingRef.current || SheetRegistry.isClosingSharingSheet()) {
        // Check if the click target is within any sharing-related element
        if (e.target instanceof HTMLElement && isSharingRelated(e.target)) {
          e.stopPropagation();
          e.preventDefault();
          
          // Create a single-use capture handler to catch any follow-up events
          const blockNextClick = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            document.removeEventListener('click', blockNextClick, true);
          };
          
          document.addEventListener('click', blockNextClick, { capture: true, once: true });
          return false;
        }
      }
    };
    
    // Add this handler with capture to ensure it runs before other handlers
    document.addEventListener('click', handleGlobalClicks, true);
    return () => {
      document.removeEventListener('click', handleGlobalClicks, true);
    };
  }, []);
  
  // Custom handlers for component props
  const handlePointerDownOutside = (event: PointerDownOutsideEvent) => {
    // Mark that we're closing the sheet
    isClosingRef.current = true;
    
    // Check for sharing-related interactions
    const target = event.target as HTMLElement;
    const originalTarget = event.detail.originalEvent.target as HTMLElement;
    
    if (isSharingRelated(originalTarget)) {
      // Mark this as a sharing sheet interaction
      SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
      
      // Block all events immediately
      addEventBlockers(500, () => {
        isClosingRef.current = false;
      });
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
  };
  
  const handleCloseAutoFocus = (event: Event) => {
    // Prevent auto-focus behavior which can trigger unwanted interactions
    event.preventDefault();
    if (onCloseAutoFocus) onCloseAutoFocus(event);
  };
  
  const handleAnimationStart = (e: React.AnimationEvent) => {
    // If this is a closing animation starting
    if (e.animationName.includes('out') || e.animationName.includes('close')) {
      isClosingRef.current = true;
    }
  };
  
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    // Check if this is the closing animation ending
    if (e.animationName.includes('out') || e.animationName.includes('close')) {
      // Add safety delay before allowing other interactions
      setTimeout(() => {
        isClosingRef.current = false;
      }, 100);
      
      // If this is a closing animation, add an event blocker
      const blockClickEvents = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();
        document.removeEventListener('click', blockClickEvents, true);
      };
      
      document.addEventListener('click', blockClickEvents, { 
        capture: true, 
        once: true 
      });
    }
  };
  
  const handleCloseClick = (e: React.MouseEvent) => {
    // When closing via the X button, ensure we block propagation
    if (e.target instanceof HTMLElement && 
        (e.target.closest('[data-sharing-sheet-id]') ||
         document.querySelector('[data-sharing-sheet-id]'))) {
      // Mark this as a sharing sheet close
      SheetRegistry.markClosingSharingSheet(sheetIdRef.current);
      
      // Add aggressive event blocking
      addEventBlockers(500);
    }
  };
  
  return {
    sheetId: sheetIdRef.current,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  };
}
