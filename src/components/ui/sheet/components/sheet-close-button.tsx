
import * as React from "react";
import { X } from "lucide-react";
import { isIOSPWA } from "@/utils/platform-detection";

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

  // Simplified, direct close handler that prioritizes closing the sheet
  const handleClose = React.useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
    console.log(`⭐ SheetCloseButton X clicked/touched for sheet ${sheetId}`);
    
    // Prevent event bubbling
    e.stopPropagation();
    e.preventDefault();
    
    // Analytics tracking through the original handler
    if ('button' in e) {
      handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
    }
    
    // DIRECT SHEET CLOSING - Most important part
    if (onOpenChange) {
      console.log(`✅ Directly calling onOpenChange(false) for sheet ${sheetId}`);
      // Use setTimeout for more reliable closing
      setTimeout(() => {
        onOpenChange(false);
      }, 0);
    } else {
      console.warn(`❌ No onOpenChange provided for sheet ${sheetId} - cannot close programmatically`);
    }
  }, [handleCloseClick, sheetId, onOpenChange]);

  // Log when component mounts to verify props
  React.useEffect(() => {
    console.log(`🔍 SheetCloseButton mounted for sheet ${sheetId}, onOpenChange present: ${!!onOpenChange}`);
    return () => console.log(`SheetCloseButton unmounted for sheet ${sheetId}`);
  }, [sheetId, onOpenChange]);
  
  return (
    <button
      className={`absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary ${
        isSharingSheet ? 'z-50' : ''
      }`}
      onClick={handleClose}
      onTouchEnd={handleClose}
      onTouchStart={(e) => e.stopPropagation()} // Prevent touch events from reaching the sheet
      data-sheet-close="true"
      data-sheet-id={sheetId}
      aria-label="Close"
      role="button"
      tabIndex={0}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
