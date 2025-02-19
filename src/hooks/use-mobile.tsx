
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Check if device is mobile using multiple methods
    const userAgent = window.navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const isMobileDevice = Boolean(
      userAgent.match(/android|webos|iphone|ipad|ipod|blackberry|windows phone/i) ||
      'ontouchstart' in window ||
      window.matchMedia('(max-width: 768px)').matches ||
      width <= MOBILE_BREAKPOINT
    );
    
    console.log("Initial mobile check:", {
      width,
      userAgent,
      isMobileDevice,
      mediaQuery: window.matchMedia('(max-width: 768px)').matches
    });
    
    return isMobileDevice;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      const isMobileDevice = Boolean(
        userAgent.match(/android|webos|iphone|ipad|ipod|blackberry|windows phone/i) ||
        'ontouchstart' in window ||
        window.matchMedia('(max-width: 768px)').matches ||
        width <= MOBILE_BREAKPOINT
      );
      
      console.log("Mobile check on resize:", {
        width,
        userAgent,
        isMobileDevice,
        mediaQuery: window.matchMedia('(max-width: 768px)').matches
      });
      
      setIsMobile(isMobileDevice);
    };

    // Check immediately
    checkMobile();

    // Add event listeners for both resize and orientation change
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return isMobile;
}
