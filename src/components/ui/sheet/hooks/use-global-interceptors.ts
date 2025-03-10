
import { useEffect } from 'react';

/**
 * Hook to apply global event interceptors for improved sheet behavior
 * This helps prevent issues with stuck sheets and animations
 */
export function useGlobalInterceptors() {
  useEffect(() => {
    // When a user navigates with keyboard or mouse 
    // during a sheet transition, we need to clean up
    const handleUserInteraction = () => {
      const blockersActive = (window as any).__eventBlockersActive;
      const startTime = (window as any).__eventBlockersStartTime || 0;
      const currentTime = Date.now();
      
      // If blockers have been active for more than 3 seconds, 
      // they're probably stuck and need to be cleared
      if (blockersActive && currentTime - startTime > 3000) {
        console.log('🧹 Cleaning up stuck event blockers from global interceptor');
        
        try {
          // Using any method available in global scope to clean up
          if (typeof (window as any).removeEventBlockers === 'function') {
            (window as any).removeEventBlockers();
          }
          
          // Reset general flags
          (window as any).__eventBlockersActive = false;
          (window as any).__isClosingSharingSheet = false;
          (window as any).__sharingProtectionActive = false;
        } catch (error) {
          console.error('Error cleaning up blockers:', error);
        }
      }
    };
    
    // Add listeners for various user interactions
    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
  
  return null;
}
