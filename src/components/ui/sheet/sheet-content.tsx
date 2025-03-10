
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"
import { SheetCloseButton, SheetOverlay, SheetPortal } from "./sheet-primitives"
import { useSheetInteractions } from "./use-sheet-interactions"
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection"

// Define sheet animation variants
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

// Define proper types for Radix events
type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  // Use the custom hook for all interaction handling
  const {
    sheetId,
    handlePointerDownOutside,
    handleCloseAutoFocus,
    handleAnimationStart,
    handleAnimationEnd,
    handleCloseClick
  } = useSheetInteractions({
    side,
    onPointerDownOutside: props.onPointerDownOutside as ((e: PointerDownOutsideEvent) => void) | undefined,
    onCloseAutoFocus: props.onCloseAutoFocus
  });
  
  // Determine if this is a sharing-related sheet based on props or className
  const isSharingSheet = 
    props['data-sharing-sheet-id'] || 
    className?.includes('sharing') || 
    false;
  
  // Determine if this is running on iOS PWA
  const isIOSPwaApp = isIOSPWA();
  
  // Save a reference to whether this is a sharing sheet for use in interaction handlers
  React.useEffect(() => {
    if (isSharingSheet) {
      // Set a reference on window for extreme cases
      (window as any).__lastActiveSharingSheetId = sheetId;
      console.log(`📱 Registered sharing sheet ${sheetId}`);
      
      return () => {
        // More aggressive protection on unmount for iOS PWA
        if (isIOSPwaApp) {
          console.log(`📱 iOS PWA: Adding maximum protection on sharing sheet unmount`);
          addShieldOverlay(3000); // Significantly longer duration
          
          // Set extreme protection - block all task card interactions for 3 seconds
          const blockTaskCardEvents = (e: Event) => {
            if (e.target instanceof Element) {
              const isTaskCard = e.target.closest('.task-card') || 
                            e.target.closest('[data-task-card]');
              
              if (isTaskCard) {
                console.log(`📱 iOS PWA: Blocking ${e.type} on task card after sheet unmount`);
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }
          };
          
          // Add document-level blockers
          document.addEventListener('click', blockTaskCardEvents, { capture: true });
          document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
          
          // Remove after protection period
          setTimeout(() => {
            document.removeEventListener('click', blockTaskCardEvents, { capture: true });
            document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
            console.log(`📱 iOS PWA: Removed unmount blockers after 3000ms`);
          }, 3000);
        }
      };
    }
  }, [isSharingSheet, sheetId, isIOSPwaApp]);
  
  // Completely revamped close handler specifically for sharing sheets
  const enhancedCloseHandler = React.useCallback((e: React.MouseEvent) => {
    console.log(`📱 Sheet close handler activated (sharing: ${isSharingSheet}, iOS PWA: ${isIOSPwaApp})`);
    
    // Always stop propagation to prevent any possible bubbling
    e.stopPropagation();
    e.preventDefault();
    
    // For all platforms, mark that a sharing sheet is closing
    if (isSharingSheet) {
      console.log(`📱 Marking sharing sheet ${sheetId} as closing`);
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
    }
    
    // Maximum protection for iOS PWA sharing sheets
    if (isSharingSheet && isIOSPwaApp) {
      console.log(`📱 iOS PWA: Maximum protection for sharing sheet close`);
      
      // Create a capture phase event blocker immediately
      const blockAllEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]');
          
          if (isTaskCard) {
            console.log(`📱 iOS PWA: Blocking event ${evt.type} in capture phase`);
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };
      
      // Add event blockers in capture phase
      document.addEventListener('touchstart', blockAllEvents, { capture: true, passive: false });
      document.addEventListener('click', blockAllEvents, { capture: true });
      
      // Extended shield overlay
      addShieldOverlay(3000);
      
      // Clean up event blockers after delay
      setTimeout(() => {
        document.removeEventListener('touchstart', blockAllEvents, { capture: true });
        document.removeEventListener('click', blockAllEvents, { capture: true });
        console.log(`📱 iOS PWA: Removed close handler blockers after 3000ms`);
      }, 3000);
    }
    
    // Call the original handler
    if (handleCloseClick) {
      handleCloseClick(e);
    }
  }, [handleCloseClick, isSharingSheet, isIOSPwaApp, sheetId]);
  
  // Adjust the z-index and animation duration for iOS PWA sharing sheets
  const iosPwaZIndex = isIOSPwaApp && isSharingSheet ? 999 : undefined;
  
  // Use long exit duration for iOS PWA sharing sheets to ensure animations finish
  const iosPwaExitDuration = isIOSPwaApp && isSharingSheet ? '3000ms' : undefined;
  
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className, {
          // Add extra z-index if this is a sharing sheet to ensure it's on top
          'z-[60]': isSharingSheet,
          'z-[999]': iosPwaZIndex
        })}
        data-sheet-id={sheetId}
        data-ios-pwa-sharing={isIOSPwaApp && isSharingSheet ? "true" : undefined}
        // These event handlers handle special cases for sheet interaction
        onCloseAutoFocus={handleCloseAutoFocus}
        onPointerDownOutside={handlePointerDownOutside}
        onAnimationStart={handleAnimationStart}
        onAnimationEnd={handleAnimationEnd}
        // Add a much longer exit animation for sharing sheets on iOS PWA
        style={{
          ...(isSharingSheet ? { 
            '--sheet-exit-duration': iosPwaExitDuration || '1200ms' 
          } as React.CSSProperties : {})
        }}
        {...props}
      >
        {children}
        <SheetCloseButton onClick={enhancedCloseHandler} />
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;
