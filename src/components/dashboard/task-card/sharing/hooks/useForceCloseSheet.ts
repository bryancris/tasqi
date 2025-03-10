
import { useEffect } from 'react';
import { isIOSPWA } from '@/utils/platform-detection';

export function useForceCloseSheet(
  open: boolean, 
  onOpenChange: (open: boolean) => void
) {
  const isIOSPwaApp = isIOSPWA();
  
  // Force-close the sheet after a delay on iOS PWA
  // This is a fallback mechanism in case normal closing fails
  useEffect(() => {
    if (isIOSPwaApp && open) {
      const closeButtonCheckInterval = setInterval(() => {
        // Check if close button was pressed but sheet didn't close
        const closeButtonPressed = (window as any).__closeButtonPressed;
        const closeButtonPressTime = (window as any).__closeButtonPressTime || 0;
        const timeSincePress = Date.now() - closeButtonPressTime;
        
        if (closeButtonPressed && timeSincePress > 300 && timeSincePress < 5000) {
          console.log("📱 iOS PWA: Detected close button press but sheet still open. Force closing...");
          onOpenChange(false);
          (window as any).__closeButtonPressed = false;
          clearInterval(closeButtonCheckInterval);
        }
      }, 500);
      
      return () => clearInterval(closeButtonCheckInterval);
    }
  }, [isIOSPwaApp, open, onOpenChange]);
}
