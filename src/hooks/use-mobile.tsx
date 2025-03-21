
import { useState, useEffect, useMemo } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial width immediately on mount
    setWidth(window.innerWidth);

    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWidth(window.innerWidth);
      }, 50); // Reduced debounce time for more responsive updates
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return useMemo(() => width <= MOBILE_BREAKPOINT, [width]);
}
