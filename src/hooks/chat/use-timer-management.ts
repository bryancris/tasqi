
import { useCallback, useRef } from "react";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { playNotificationSound } from "@/utils/notifications/soundUtils";

export function useTimerManagement(
  debouncedRefresh: (queryKey: string[], delay: number) => void,
  isMountedRef: React.RefObject<boolean>
) {
  const { showNotification } = useNotifications();
  const timerPhrasesDetectedRef = useRef<Set<string>>(new Set());
  const timerProcessingRef = useRef<boolean>(false);

  const handleTimerResponse = useCallback(async (timerData: any) => {
    if (!timerData || !isMountedRef.current) {
      console.log('⚠️ Invalid timer data or component unmounted');
      return;
    }
    
    // Prevent concurrent timer processing
    if (timerProcessingRef.current) {
      console.log('⚠️ Already processing a timer response, skipping');
      return;
    }
    
    timerProcessingRef.current = true;
    
    try {
      console.log('⏰ Processing timer data:', timerData);
      
      if (timerData.action === 'created') {
        // Calculate a display-friendly duration
        const label = timerData.label || `${timerData.duration} ${timerData.unit}${timerData.duration > 1 && !timerData.unit.endsWith('s') ? 's' : ''}`;
        
        try {
          // Play notification sound with good error handling
          await playNotificationSound().catch(soundError => {
            console.warn('Failed to play notification sound:', soundError);
          });
          
          // Show notification with proper error handling
          await showNotification({
            title: "Timer Started",
            message: `Timer for ${label} has been started`,
            type: "info",
            persistent: false
          });
          
          console.log('✅ Timer notification shown successfully');
        } catch (notificationError) {
          console.error('❌ Failed to show timer notification:', notificationError);
        }
        
        // Refresh timer list with sufficient delay
        setTimeout(() => {
          if (isMountedRef.current) {
            debouncedRefresh(['timers'], 800);
          }
        }, 300);
      } else if (timerData.action === 'completed' || timerData.action === 'cancelled') {
        try {
          // Wait a moment before processing completion to avoid UI jank
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await playNotificationSound().catch(soundError => {
            console.warn('Failed to play timer completion sound:', soundError);
          });
          
          const title = timerData.action === 'completed' ? "Timer Complete" : "Timer Cancelled";
          const message = timerData.action === 'completed' 
            ? `Your timer for ${timerData.label || 'task'} is complete`
            : `Your timer for ${timerData.label || 'task'} has been cancelled`;
          
          await showNotification({
            title,
            message,
            type: timerData.action === 'completed' ? "success" : "info",
            persistent: timerData.action === 'completed'
          });
          
          console.log(`✅ Timer ${timerData.action} notification shown`);
        } catch (notificationError) {
          console.error(`❌ Failed to show timer ${timerData.action} notification:`, notificationError);
        }
        
        // Refresh with sufficient delay and separation
        setTimeout(() => {
          if (isMountedRef.current) {
            debouncedRefresh(['timers'], 1000);
            setTimeout(() => {
              if (isMountedRef.current) {
                debouncedRefresh(['notifications'], 1200);
              }
            }, 300);
          }
        }, 300);
      }
    } finally {
      // Always reset the processing flag
      setTimeout(() => {
        timerProcessingRef.current = false;
      }, 500);
    }
  }, [debouncedRefresh, isMountedRef, showNotification]);

  return {
    handleTimerResponse,
    timerPhrasesDetectedRef
  };
}
