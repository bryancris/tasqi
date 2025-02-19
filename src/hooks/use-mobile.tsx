
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    const mobile = width < MOBILE_BREAKPOINT;
    console.log("Initial window width:", width, "Is mobile:", mobile);
    return mobile;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width < MOBILE_BREAKPOINT;
      console.log("Window width changed:", width, "Is mobile:", mobile);
      setIsMobile(mobile);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
