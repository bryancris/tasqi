
import * as React from "react";
import { useSheetLifecycle } from "./hooks/use-sheet-lifecycle";
import { useSheetInterceptors, PointerDownOutsideEvent } from "./hooks/use-sheet-interceptors";
import { useSheetCloseButton } from "./hooks/use-sheet-close-button";
import { useGlobalInterceptors } from "./hooks/use-global-interceptors";

// Define proper types for Radix events
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
  // Use the sheet lifecycle hook
  const {
    sheetId,
    isClosingRef,
    handleAnimationStart,
    handleAnimationEnd
  } = useSheetLifecycle();
  
  // Use the sheet interceptors hook
  const {
    handlePointerDownOutside,
    handleCloseAutoFocus
  } = useSheetInterceptors({
    sheetId,
    isClosingRef,
    onPointerDownOutside,
    onCloseAutoFocus
  });
  
  // Use the close button handler
  const { handleCloseClick } = useSheetCloseButton({
    sheetId
  });
  
  // Apply global event interceptors
  useGlobalInterceptors();
  
  return {
    sheetId,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  };
}
