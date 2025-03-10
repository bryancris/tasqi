
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
        // Far more aggressive protection on unmount for iOS PWA
        if (isIOSPwaApp) {
          console.log(`📱 iOS PWA: Adding EXTREME protection on sharing sheet unmount`);
          
          // Add shield overlay with much longer duration
          addShieldOverlay(6000); 
          
          // Set extreme protection flags
          (window as any).__extremeProtectionActive = true;
          (window as any).__extremeProtectionStartTime = Date.now();
          
          // Block all task card interactions for much longer
          const blockTaskCardEvents = (e: Event) => {
            if (e.target instanceof Element) {
              // Enhanced task card detection
              const isTaskCard = e.target.closest('.task-card') || 
                            e.target.closest('[data-task-card]') ||
                            e.target.closest('[role="button"]') ||
                            (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
              
              // Skip control elements
              const isControl = e.target.closest('button') ||
                          e.target.closest('[data-radix-dialog-close]');
              
              if (isTaskCard && !isControl) {
                console.log(`📱 iOS PWA: Blocking ${e.type} on task card after sheet unmount`);
                e.preventDefault();
                e.stopPropagation();
                return false;
              }
            }
          };
          
          // Add multiple layers of document-level blockers 
          document.addEventListener('click', blockTaskCardEvents, { capture: true });
          document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
          document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
          document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });
          
          // Remove protections in phases
          setTimeout(() => {
            document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
            document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
            console.log(`📱 iOS PWA: Removed first layer of unmount blockers after 4000ms`);
          }, 4000);
          
          setTimeout(() => {
            document.removeEventListener('click', blockTaskCardEvents, { capture: true });
            document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
            console.log(`📱 iOS PWA: Removed second layer of unmount blockers after 6000ms`);
            
            // Clear extreme protection flag if it hasn't been reset by something else
            if ((window as any).__extremeProtectionStartTime === Date.now()) {
              (window as any).__extremeProtectionActive = false;
            }
          }, 6000);
        }
      };
    }
  }, [isSharingSheet, sheetId, isIOSPwaApp]);
  
  // Completely revamped close handler with extreme protection for iOS PWA
  const enhancedCloseHandler = React.useCallback((e: React.MouseEvent) => {
    console.log(`📱 Sheet close handler activated (sharing: ${isSharingSheet}, iOS PWA: ${isIOSPwaApp})`);
    
    // Always stop propagation to prevent any possible bubbling
    e.stopPropagation();
    e.preventDefault();
    
    // Set standard sharing sheet closing flags
    if (isSharingSheet) {
      console.log(`📱 Marking sharing sheet ${sheetId} as closing`);
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      (window as any).__lastSheetCloseId = `${sheetId}-${Date.now()}`;
    }
    
    // Extreme protection for iOS PWA sharing sheets
    if (isSharingSheet && isIOSPwaApp) {
      console.log(`📱 iOS PWA: EXTREME protection for sharing sheet close`);
      
      // Set extreme protection flags
      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();
      
      // Add shield overlay with very long duration
      addShieldOverlay(6000);
      
      // Create a multi-layered capture phase event blocker immediately
      const blockAllEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          // Enhanced task card detection
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]') ||
                        evt.target.closest('[role="button"]') ||
                        (evt.target.getAttribute && evt.target.getAttribute('data-task-card') === 'true');
          
          // Skip controls and sharing indicators
          const isControl = evt.target.closest('button') ||
                      evt.target.closest('[data-radix-dialog-close]') ||
                      evt.target.closest('[data-sharing-indicator="true"]');
          
          if (isTaskCard && !isControl) {
            console.log(`📱 iOS PWA: Blocking event ${evt.type} in capture phase`);
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };
      
      // Add multiple layers of event blockers in capture phase
      document.addEventListener('touchstart', blockAllEvents, { capture: true, passive: false });
      document.addEventListener('touchend', blockAllEvents, { capture: true, passive: false });
      document.addEventListener('click', blockAllEvents, { capture: true });
      document.addEventListener('mousedown', blockAllEvents, { capture: true });
      
      // Remove in phases for maximum protection duration
      setTimeout(() => {
        document.removeEventListener('touchstart', blockAllEvents, { capture: true });
        document.removeEventListener('touchend', blockAllEvents, { capture: true });
        console.log(`📱 iOS PWA: Removed first layer of close handler blockers after 4000ms`);
      }, 4000);
      
      setTimeout(() => {
        document.removeEventListener('click', blockAllEvents, { capture: true });
        document.removeEventListener('mousedown', blockAllEvents, { capture: true });
        console.log(`📱 iOS PWA: Removed second layer of close handler blockers after 6000ms`);
        
        // Only clear extreme protection if this was the originator
        const originTime = (window as any).__extremeProtectionStartTime;
        if (originTime && Date.now() - originTime > 5900) {
          (window as any).__extremeProtectionActive = false;
        }
      }, 6000);
    }
    
    // Call the original handler
    if (handleCloseClick) {
      handleCloseClick(e);
    }
  }, [handleCloseClick, isSharingSheet, isIOSPwaApp, sheetId]);
  
  // Adjust the z-index and animation duration for iOS PWA sharing sheets
  const iosPwaZIndex = isIOSPwaApp && isSharingSheet ? 999 : undefined;
  
  // Use much longer exit duration for iOS PWA sharing sheets to ensure animations finish
  const iosPwaExitDuration = isIOSPwaApp && isSharingSheet ? '6000ms' : undefined;
  
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
            '--sheet-exit-duration': iosPwaExitDuration || '2000ms' 
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
