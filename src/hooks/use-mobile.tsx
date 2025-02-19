
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Set viewport meta tag
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    const userAgent = window.navigator.userAgent;
    const mobile = width < MOBILE_BREAKPOINT || /Mobi|Android/i.test(userAgent);
    console.log("Initial check - Width:", width, "User Agent:", userAgent, "Is Mobile:", mobile);
    return mobile;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const width = window.innerWidth;
      const userAgent = window.navigator.userAgent;
      const mobile = width < MOBILE_BREAKPOINT || /Mobi|Android/i.test(userAgent);
      console.log("Check mobile - Width:", width, "User Agent:", userAgent, "Is Mobile:", mobile);
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
