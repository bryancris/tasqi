import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { SheetCloseButton, SheetOverlay, SheetPortal } from "./sheet-primitives"
import { useSheetInteractions } from "./use-sheet-interactions"
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection"

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
  VariantProps<typeof sheetVariants> {}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
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

  const isSharingSheet = 
    props['data-sharing-sheet-id'] || 
    className?.includes('sharing') || 
    false;

  const isIOSPwaApp = isIOSPWA();

  React.useEffect(() => {
    if (isSharingSheet) {
      (window as any).__lastActiveSharingSheetId = sheetId;
      console.log(`📱 Registered sharing sheet ${sheetId}`);

      return () => {
        if (isIOSPwaApp) {
          console.log(`📱 iOS PWA: Adding EXTREME protection on sharing sheet unmount`);

          addShieldOverlay(6000);

          (window as any).__extremeProtectionActive = true;
          (window as any).__extremeProtectionStartTime = Date.now();

          const blockTaskCardEvents = (e: Event) => {
            if (e.target instanceof Element) {
              const isTaskCard = e.target.closest('.task-card') || 
                            e.target.closest('[data-task-card]') ||
                            e.target.closest('[role="button"]') ||
                            (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');

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

          document.addEventListener('click', blockTaskCardEvents, { capture: true });
          document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
          document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
          document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });

          setTimeout(() => {
            document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
            document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
            console.log(`📱 iOS PWA: Removed first layer of unmount blockers after 4000ms`);
          }, 4000);

          setTimeout(() => {
            document.removeEventListener('click', blockTaskCardEvents, { capture: true });
            document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
            console.log(`📱 iOS PWA: Removed second layer of unmount blockers after 6000ms`);

            if ((window as any).__extremeProtectionStartTime === Date.now()) {
              (window as any).__extremeProtectionActive = false;
            }
          }, 6000);
        }
      };
    }
  }, [isSharingSheet, sheetId, isIOSPwaApp]);

  const enhancedCloseHandler = React.useCallback((e: React.MouseEvent) => {
    console.log(`📱 Sheet close button clicked (sharing: ${isSharingSheet}, iOS PWA: ${isIOSPwaApp})`);

    e.stopPropagation();
    e.preventDefault();

    if (isSharingSheet) {
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      (window as any).__lastSheetCloseId = `${sheetId}-${Date.now()}`;
    }

    if (isSharingSheet && isIOSPwaApp) {
      console.log(`📱 iOS PWA: Adding close button protection`);

      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();

      addShieldOverlay(6000);

      const blockTaskCardEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]') ||
                        evt.target.closest('[role="button"]');

          const isControl = evt.target.closest('[data-sheet-close]') ||
                       evt.target.closest('button') ||
                       evt.target.closest('[data-radix-dialog-close]');

          if (isTaskCard && !isControl) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };

      document.addEventListener('click', blockTaskCardEvents, { capture: true });
      document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
      document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });

      setTimeout(() => {
        document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
      }, 4000);

      setTimeout(() => {
        document.removeEventListener('click', blockTaskCardEvents, { capture: true });
      }, 6000);
    }

    if (handleCloseClick) {
      handleCloseClick(e);
    }
  }, [handleCloseClick, isSharingSheet, isIOSPwaApp, sheetId]);

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
        style={{
          ...(isSharingSheet ? { 
            '--sheet-exit-duration': isIOSPwaApp ? '6000ms' : '2000ms' 
          } as React.CSSProperties : {})
        }}
        {...props}
      >
        {children}
        <SheetPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={enhancedCloseHandler}
          data-sheet-close="true"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;
