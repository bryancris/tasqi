
import { useEffect } from "react";
import { isIOSPWA } from "@/utils/platform-detection";

interface UseSharingSheetEffectProps {
  isSharingSheet: boolean;
  sheetId: string;
}

export function useSharingSheetEffect({ isSharingSheet, sheetId }: UseSharingSheetEffectProps) {
  const isIOSPwaApp = isIOSPWA();
  
  // Add iOS PWA specific styling classes when sheet is open
  useEffect(() => {
    if (isIOSPwaApp && isSharingSheet) {
      // Add a class to the body to enable additional CSS protection
      document.body.classList.add('ios-pwa-sharing-active');
      
      // Remove the class when the sheet closes or component unmounts
      return () => {
        document.body.classList.remove('ios-pwa-sharing-active');
      };
    }
  }, [isIOSPwaApp, isSharingSheet]);
  
  return null;
}
