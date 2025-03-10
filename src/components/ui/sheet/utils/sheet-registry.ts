
/**
 * Registry for tracking active sheets and their states
 */
import { isIOSPWA } from "@/utils/platform-detection";

/**
 * Global registry for active sheets and sharing sheets
 */
export const SheetRegistry = {
  activeSheets: {} as Record<string, boolean>,
  closingSharingSheet: null as string | null,
  
  registerSheet(id: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__activeSheets = (window as any).__activeSheets || {};
      (window as any).__activeSheets[id] = true;
    }
  },
  
  unregisterSheet(id: string): void {
    if (typeof window !== 'undefined' && (window as any).__activeSheets) {
      delete (window as any).__activeSheets[id];
    }
  },
  
  markClosingSharingSheet(id: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__closingSharingSheet = id;
      // Set a global flag to track closing state
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      
      // Clear after platform-specific delay
      const timeoutDuration = isIOSPWA() ? 2000 : 1500;
      
      setTimeout(() => {
        if ((window as any).__closingSharingSheet === id) {
          (window as any).__closingSharingSheet = null;
          (window as any).__isClosingSharingSheet = false;
        }
      }, timeoutDuration); 
    }
  },
  
  isClosingSharingSheet(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isClosing = !!(window as any).__closingSharingSheet || !!(window as any).__isClosingSharingSheet;
    
    // Also check if the closing happened recently
    if (!isClosing) {
      const closeTime = (window as any).__sharingSheetCloseTime || 0;
      const now = Date.now();
      // Use platform-specific timeout
      const timeoutDuration = isIOSPWA() ? 2000 : 1500;
      const timeSinceClose = now - closeTime;
      
      return timeSinceClose < timeoutDuration;
    }
    
    return isClosing;
  }
};
