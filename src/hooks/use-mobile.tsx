
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // Default to mobile first
    
    // Use a more aggressive mobile detection approach
    const width = window.innerWidth;
    return width <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const width = window.innerWidth;
      const shouldBeMobile = width <= MOBILE_BREAKPOINT;
      
      console.log("Mobile check:", {
        width,
        shouldBeMobile,
        currentState: isMobile
      });
      
      if (shouldBeMobile !== isMobile) {
        setIsMobile(shouldBeMobile);
      }
    };

    // Check immediately and on every resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [isMobile]);

  return isMobile;
}
