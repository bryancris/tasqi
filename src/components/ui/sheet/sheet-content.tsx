
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"
import { SheetCloseButton } from "./components/sheet-close-button"
import { SheetOverlay, SheetPortal } from "./sheet-primitives"
import { useSheetInteractions } from "./use-sheet-interactions"
import { isIOSPWA } from "@/utils/platform-detection"
import { useSharingSheetEffect } from "./hooks/use-sharing-sheet-effect"
import { useSwipeToClose } from "./hooks/use-swipe-to-close"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 overflow-hidden flex flex-col",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> {
  onOpenChange?: (open: boolean) => void;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, onOpenChange, ...props }, ref) => {
  const {
    sheetId,
    isClosing,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  } = useSheetInteractions({
    side,
    onPointerDownOutside: props.onPointerDownOutside as ((e: any) => void) | undefined,
    onCloseAutoFocus: props.onCloseAutoFocus
  });

  // Determine if this is a sharing sheet based on data attribute or class
  const isSharingSheet = 
    props['data-sharing-sheet-id'] || 
    className?.includes('sharing') || 
    false;

  const isIOSPwaApp = isIOSPWA();
  
  // Use custom hook for sharing sheet effects
  useSharingSheetEffect({
    isSharingSheet,
    sheetId
  });
  
  // Handler for swipe to close
  const handleClose = React.useCallback(() => {
    if (onOpenChange) {
      console.log(`⭐ SheetContent calling onOpenChange(false) for sheet ${sheetId}`);
      onOpenChange(false);
    } else {
      console.log(`❌ SheetContent has no onOpenChange for sheet ${sheetId}`);
    }
  }, [onOpenChange, sheetId]);
  
  // Use swipe to close hook
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    swipeTransform,
    isSwiping
  } = useSwipeToClose({
    onClose: handleClose,
    isClosing,
    side
  });
  
  // Generate styling based on swipe state
  const swipeStyle = React.useMemo(() => {
    if (!isSwiping && !swipeTransform) return {};
    
    return {
      transform: swipeTransform,
      transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
    } as React.CSSProperties;
  }, [isSwiping, swipeTransform]);

  // Log when the SheetContent mounts to verify onOpenChange presence
  React.useEffect(() => {
    console.log(`SheetContent mounted for sheet ${sheetId}, onOpenChange present: ${!!onOpenChange}`);
    return () => console.log(`SheetContent unmounted for sheet ${sheetId}`);
  }, [sheetId, onOpenChange]);

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        data-sheet-id={sheetId}
        data-ios-pwa-sharing={isIOSPwaApp && isSharingSheet ? "true" : undefined}
        onCloseAutoFocus={handleCloseAutoFocus}
        onPointerDownOutside={handlePointerDownOutside}
        onAnimationStart={handleAnimationStart}
        onAnimationEnd={handleAnimationEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onPointerDown={handleTouchStart}
        onPointerMove={handleTouchMove}
        onPointerUp={handleTouchEnd}
        onPointerCancel={handleTouchCancel}
        style={{
          ...(isSharingSheet ? { 
            '--sheet-exit-duration': isIOSPwaApp ? '6000ms' : '2000ms' 
          } as React.CSSProperties : {}),
          ...swipeStyle
        }}
        {...props}
      >
        {/* Add a visual handle indicator for swipe on mobile */}
        <div 
          className="w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-2 opacity-70" 
          aria-hidden="true"
        />
        
        {children}
        
        {/* IMPORTANT: Directly pass onOpenChange to SheetCloseButton */}
        <SheetCloseButton 
          isSharingSheet={isSharingSheet}
          sheetId={sheetId}
          handleCloseClick={handleCloseClick}
          onOpenChange={onOpenChange}
        />
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});

SheetContent.displayName = SheetPrimitive.Content.displayName;
