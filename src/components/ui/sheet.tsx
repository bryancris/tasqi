
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

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

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> { }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  // Using a ref to track if we're in the process of closing the sheet
  const isClosingRef = React.useRef(false);
  const sheetIdRef = React.useRef<string>(`sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // On first render, store this sheet's ID
  React.useEffect(() => {
    // Create a global registry if it doesn't exist
    if (typeof window !== 'undefined') {
      (window as any).__activeSheets = (window as any).__activeSheets || {};
      (window as any).__activeSheets[sheetIdRef.current] = true;
      
      return () => {
        // Clean up registry on unmount
        if ((window as any).__activeSheets) {
          delete (window as any).__activeSheets[sheetIdRef.current];
        }
      };
    }
  }, []);
  
  React.useEffect(() => {
    // This function will run when a sheet is closed with any outside click
    const handleGlobalClicks = (e: MouseEvent) => {
      // If this is a sharing indicator-related sheet being closed
      if (isClosingRef.current || (window as any).__closingSharingSheet) {
        // Check if the click target is within any sharing-indicator
        const isSharingRelated = 
          e.target instanceof HTMLElement &&
          (e.target.closest('[data-sharing-indicator]') || 
           e.target.closest('[data-sharing-sheet-id]'));
        
        if (isSharingRelated) {
          e.stopPropagation();
          e.preventDefault();
          
          // Create a single-use capture handler to catch any follow-up events
          const blockNextClick = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();
            document.removeEventListener('click', blockNextClick, true);
          };
          
          document.addEventListener('click', blockNextClick, { capture: true, once: true });
          return false;
        }
      }
    };
    
    // Add this handler with capture to ensure it runs before other handlers
    document.addEventListener('click', handleGlobalClicks, true);
    return () => {
      document.removeEventListener('click', handleGlobalClicks, true);
    };
  }, []);
  
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        data-sheet-id={sheetIdRef.current}
        onCloseAutoFocus={(e) => {
          // Prevent auto-focus behavior which can trigger unwanted interactions
          e.preventDefault();
          if (props.onCloseAutoFocus) props.onCloseAutoFocus(e);
        }}
        onPointerDownOutside={(e) => {
          // Track that we're closing the sheet
          isClosingRef.current = true;
          
          // Check for data attribute to identify sharing interactions
          const isSharingRelated = 
            e.target instanceof HTMLElement && 
            (e.target.closest('[data-sharing-indicator]') || 
             e.target.closest('[data-sharing-sheet-id]'));
          
          // Special handling for sharing-related sheets
          if (isSharingRelated) {
            // Mark this as a sharing sheet interaction
            (window as any).__closingSharingSheet = sheetIdRef.current;
            
            // Block all events immediately
            const blockEvents = (evt: Event) => {
              evt.stopPropagation();
              evt.preventDefault();
              return false;
            };
            
            // Add short-lived but aggressive event blocking
            document.addEventListener('click', blockEvents, { capture: true });
            document.addEventListener('mousedown', blockEvents, { capture: true });
            document.addEventListener('pointerdown', blockEvents, { capture: true });
            
            // Clean up after a short delay
            setTimeout(() => {
              document.removeEventListener('click', blockEvents, { capture: true });
              document.removeEventListener('mousedown', blockEvents, { capture: true });
              document.removeEventListener('pointerdown', blockEvents, { capture: true });
              
              if ((window as any).__closingSharingSheet === sheetIdRef.current) {
                (window as any).__closingSharingSheet = null;
              }
              
              isClosingRef.current = false;
            }, 500);
          }
          
          // Prevent closing the sheet when clicking on calendar or popover elements
          if (e.target instanceof HTMLElement) {
            // Check for any calendar-related elements
            if (e.target.closest('.rdp') || 
                e.target.closest('.react-calendar') || 
                e.target.closest('.calendar') || 
                e.target.closest('[data-radix-popper-content-wrapper]') ||
                e.target.closest('[data-radix-popup-content]') ||
                e.target.closest('.DayPicker') ||
                e.target.closest('.DayPicker-Month') ||
                e.target.closest('.DayPicker-Day') ||
                document.querySelector('[data-radix-popper-content-wrapper]')?.contains(e.target) ||
                document.querySelector('.z-\\[9999\\]')?.contains(e.target)) {
              console.log("Preventing sheet close due to calendar interaction");
              e.preventDefault();
              return;
            }
          }
          
          // Check if the clicked element is part of an open popover
          const popoverElements = document.querySelectorAll('[role="dialog"][data-state="open"]');
          for (const element of popoverElements) {
            if (element.contains(e.target as Node)) {
              console.log("Preventing sheet close due to popover interaction");
              e.preventDefault();
              return;
            }
          }
          
          if (props.onPointerDownOutside) props.onPointerDownOutside(e);
        }}
        // Add handlers for animation events
        onAnimationStart={(e) => {
          // If this is a closing animation starting
          if (e.animationName.includes('out') || e.animationName.includes('close')) {
            isClosingRef.current = true;
          }
          
          if (props.onAnimationStart) props.onAnimationStart(e);
        }}
        onAnimationEnd={(e) => {
          // Check if this is the closing animation ending
          if (e.animationName.includes('out') || e.animationName.includes('close')) {
            // Add safety delay before allowing other interactions
            setTimeout(() => {
              isClosingRef.current = false;
            }, 100);
            
            // If this is a closing animation, add an event blocker
            const blockClickEvents = (evt: MouseEvent) => {
              evt.stopPropagation();
              evt.preventDefault();
              document.removeEventListener('click', blockClickEvents, true);
            };
            
            document.addEventListener('click', blockClickEvents, { 
              capture: true, 
              once: true 
            });
          }
          
          if (props.onAnimationEnd) props.onAnimationEnd(e);
        }}
        {...props}
      >
        {children}
        <SheetPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          onClick={(e) => {
            // When closing via the X button, ensure we block propagation
            if (e.target instanceof HTMLElement && 
                (e.target.closest('[data-sharing-sheet-id]') ||
                 document.querySelector('[data-sharing-sheet-id]'))) {
              // Mark this as a sharing sheet close
              (window as any).__closingSharingSheet = sheetIdRef.current;
              
              // Add super aggressive event blocking
              const blockAllEvents = (evt: Event) => {
                evt.stopPropagation();
                evt.preventDefault();
                return false;
              };
              
              document.addEventListener('click', blockAllEvents, { capture: true });
              document.addEventListener('mousedown', blockAllEvents, { capture: true });
              document.addEventListener('mouseup', blockAllEvents, { capture: true });
              
              // Clean up after a delay
              setTimeout(() => {
                document.removeEventListener('click', blockAllEvents, { capture: true });
                document.removeEventListener('mousedown', blockAllEvents, { capture: true });
                document.removeEventListener('mouseup', blockAllEvents, { capture: true });
                
                if ((window as any).__closingSharingSheet === sheetIdRef.current) {
                  (window as any).__closingSharingSheet = null;
                }
              }, 500);
            }
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}
