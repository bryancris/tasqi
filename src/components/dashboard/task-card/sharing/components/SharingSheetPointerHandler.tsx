
import { addShieldOverlay } from '@/utils/platform-detection';

// Define the correct type for PointerDownOutsideEvent
type PointerDownOutsideEvent = {
  preventDefault: () => void;
  detail: {
    originalEvent: PointerEvent;
  };
};

interface SharingSheetPointerHandlerProps {
  isIOSPwaApp: boolean;
}

export function useSharingSheetPointerHandler({ isIOSPwaApp }: SharingSheetPointerHandlerProps) {
  const handlePointerDownOutside = (e: PointerDownOutsideEvent) => {
    // Aggressive prevention on pointer events outside the sheet
    e.preventDefault();
    
    if (isIOSPwaApp) {
      console.log("📱 iOS PWA: Pointer outside sharing sheet - adding EXTREME protection");
      
      // Set extreme protection flags
      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();
      
      // Add shield overlay for extreme duration
      addShieldOverlay(6000);
      
      const blockTaskCardEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]') ||
                        evt.target.closest('[role="button"]');
          
          if (isTaskCard) {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };
      
      document.addEventListener('click', blockTaskCardEvents, { capture: true });
      document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
      
      setTimeout(() => {
        document.removeEventListener('click', blockTaskCardEvents, { capture: true });
        document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
      }, 6000);
    }
  };

  return { handlePointerDownOutside };
}
