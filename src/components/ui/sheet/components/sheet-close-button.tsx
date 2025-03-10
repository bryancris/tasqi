
import * as React from "react";
import { X } from "lucide-react";
import { isIOSPWA } from "@/utils/platform-detection";
import { useSheetCloseHandler } from "../hooks/use-sheet-close-handler";

interface SheetCloseButtonProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

export function SheetCloseButton({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: SheetCloseButtonProps) {
  const isIOSPwaApp = isIOSPWA();
  
  // Use the enhanced close handler with all required props
  const { enhancedCloseHandler } = useSheetCloseHandler({
    isSharingSheet,
    sheetId,
    handleCloseClick,
    onOpenChange
  });
  
  return (
    <button
      className={`absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary ${
        isSharingSheet ? 'z-50' : ''
      }`}
      onClick={enhancedCloseHandler}
      onTouchEnd={enhancedCloseHandler}
      data-sheet-close="true"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
