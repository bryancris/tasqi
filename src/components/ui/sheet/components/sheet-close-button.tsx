
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

  // Simplified direct close handler for button clicks and touches
  const handleClose = React.useCallback((e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
    // Prevent event bubbling
    e.stopPropagation();
    e.preventDefault();
    
    console.log(`⭐ SheetCloseButton X clicked for sheet ${sheetId}, onOpenChange present: ${!!onOpenChange}`);
    
    // Call original tracking handler
    if ('button' in e) {
      try {
        handleCloseClick(e as React.MouseEvent<Element, MouseEvent>);
      } catch (err) {
        console.error('Error in tracking click handler:', err);
      }
    }
    
    // DIRECT SHEET CLOSING - Most important part
    if (onOpenChange) {
      console.log(`✅ Directly calling onOpenChange(false) for sheet ${sheetId}`);
      
      // Use both immediate and timeout calls for reliability
      try {
        onOpenChange(false); // Try immediate close
      } catch (err) {
        console.error('Error in immediate sheet close:', err);
      }
      
      // Also try with timeout as fallback
      setTimeout(() => {
        try {
          if (onOpenChange) onOpenChange(false);
        } catch (err) {
          console.error('Error in delayed sheet close:', err);
        }
      }, 0);
    } else {
      console.error(`❌ No onOpenChange provided for sheet ${sheetId} - cannot close programmatically`);
    }
  }, [handleCloseClick, sheetId, onOpenChange]);

  // Debug: log to console when the component mounts
  React.useEffect(() => {
    console.log(`🔍 SheetCloseButton mounted for sheet ${sheetId}, onOpenChange present: ${!!onOpenChange}`);
    
    // Make onOpenChange globally available for debugging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      (window as any)[`sheetCloseButton_${sheetId}`] = {
        hasCloseHandler: !!onOpenChange
      };
    }
    
    return () => {
      console.log(`SheetCloseButton unmounted for sheet ${sheetId}`);
      if (process.env.NODE_ENV !== 'production') {
        delete (window as any)[`sheetCloseButton_${sheetId}`];
      }
    }
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
      data-has-handler={!!onOpenChange ? "true" : "false"}
      aria-label="Close"
      role="button"
      tabIndex={0}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
