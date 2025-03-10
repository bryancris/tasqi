
import { X } from "lucide-react";
import * as React from "react";
import { useSheetCloseHandler, CombinedEvent } from "../hooks/close-handler";
import { isIOSPWA } from "@/utils/platform-detection";

interface SheetCloseButtonProps {
  isSharingSheet: boolean;
  sheetId: string;
  handleCloseClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

export function SheetCloseButton({
  isSharingSheet,
  sheetId,
  handleCloseClick,
  onOpenChange
}: SheetCloseButtonProps) {
  const isIOSPwaApp = isIOSPWA();
  const { enhancedCloseHandler } = useSheetCloseHandler({
    isSharingSheet,
    sheetId,
    handleCloseClick,
    onOpenChange
  });

  return (
    <div 
      className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      onClick={enhancedCloseHandler}
      onTouchStart={isIOSPwaApp ? enhancedCloseHandler : undefined}
      onTouchEnd={(e) => {
        if (isIOSPwaApp) {
          console.log("📱 iOS PWA: TouchEnd on close button");
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      data-sheet-close="true"
      role="button"
      tabIndex={0}
      aria-label="Close"
      style={{ 
        padding: isIOSPwaApp ? '12px' : '8px',
        touchAction: 'manipulation'
      }}
    >
      <X className={isIOSPwaApp ? "h-5 w-5" : "h-4 w-4"} />
      <span className="sr-only">Close</span>
    </div>
  );
}
