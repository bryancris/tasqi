
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
  
  // Simple but robust close handler that prioritizes the sheet actually closing
  const handleClose = React.useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
    console.log(`SheetCloseButton clicked/touched for sheet ${sheetId}`);
    
    // Prevent event bubbling to avoid potential conflicts
    e.stopPropagation();
    e.preventDefault();
    
    // Track the click via the original handler
    if ('button' in e) {
      handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
    }
    
    // Most important part: ALWAYS call onOpenChange to ensure the sheet closes
    if (onOpenChange) {
      console.log(`Directly calling onOpenChange(false) for sheet ${sheetId}`);
      
      // Small timeout to ensure event handling is complete
      setTimeout(() => {
        onOpenChange(false);
      }, 10);
    } else {
      console.warn(`No onOpenChange provided for sheet ${sheetId} - cannot close programmatically`);
    }
  }, [handleCloseClick, sheetId, onOpenChange]);

  // Log when component mounts
  React.useEffect(() => {
    console.log(`SheetCloseButton mounted for sheet ${sheetId}, onOpenChange present: ${!!onOpenChange}`);
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
