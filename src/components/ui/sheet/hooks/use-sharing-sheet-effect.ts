
import * as React from "react";
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection";

interface UseSharingSheetEffectProps {
  isSharingSheet: boolean;
  sheetId: string;
}

export function useSharingSheetEffect({ isSharingSheet, sheetId }: UseSharingSheetEffectProps) {
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
}
