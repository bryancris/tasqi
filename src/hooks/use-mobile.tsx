
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log("Window width:", window.innerWidth, "Is mobile:", mobile);
      setIsMobile(mobile);
    };

    // Initial check
    checkMobile();

    // Add event listener with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
}
