
import { useCallback, MutableRefObject } from 'react';

// Define PointerDownOutsideEvent type
export type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface UseSheetInterceptorsProps {
  sheetId: string;
  isClosingRef: MutableRefObject<boolean>;
  onPointerDownOutside?: (e: PointerDownOutsideEvent) => void;
  onCloseAutoFocus?: (e: Event) => void;
}

/**
 * Hook to handle special sheet events
 * Provides handlers for pointer events outside the sheet and auto focus
 */
export function useSheetInterceptors({
  sheetId,
  isClosingRef,
  onPointerDownOutside,
  onCloseAutoFocus
}: UseSheetInterceptorsProps) {
  // Handle pointerdown events outside the sheet
  const handlePointerDownOutside = useCallback((e: PointerDownOutsideEvent) => {
    // Call original handler if provided
    if (onPointerDownOutside) {
      onPointerDownOutside(e);
    }
    
    // If sheet is closing, prevent any outside clicks
    if (isClosingRef.current) {
      e.preventDefault();
    }
  }, [onPointerDownOutside, isClosingRef]);
  
  // Handle auto focus when sheet closes
  const handleCloseAutoFocus = useCallback((e: Event) => {
    // Prevent auto focus on close to avoid accessibility issues
    e.preventDefault();
    
    // Call original handler if provided
    if (onCloseAutoFocus) {
      onCloseAutoFocus(e);
    }
  }, [onCloseAutoFocus]);
  
  return {
    handlePointerDownOutside,
    handleCloseAutoFocus
  };
}
