
import { useRef, useCallback, useEffect } from "react";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { useNotifications } from "@/components/notifications/NotificationsManager";

type ActiveTimer = {
  id: string;
  timeoutId: NodeJS.Timeout;
  label: string;
  expiresAt: number;
};

export function useTimerManagement(debouncedRefresh: (queryKey: string[], delay: number) => void, isMountedRef: React.RefObject<boolean>) {
  const { showNotification } = useNotifications();
  const activeTimersRef = useRef<Map<string, ActiveTimer>>(new Map());
  const timerPhrasesDetectedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(timer => {
        clearTimeout(timer.timeoutId);
      });
      activeTimersRef.current.clear();
    };
  }, []);

  const handleTimerResponse = useCallback(async (timerData: any) => {
    if (!timerData || !isMountedRef.current) {
      console.log('⚠️ Timer data is empty or undefined, or component unmounted');
      return;
    }
    
    console.log('📅 Processing timer response:', timerData);
    
    if (timerData.action === 'created') {
      try {
        // Store this timer phrase to prevent duplicate notifications
        if (timerData.label) {
          timerPhrasesDetectedRef.current.add(timerData.label.toLowerCase());
        }
        
        await showNotification({
          title: `Timer Set: ${timerData.label || 'Unnamed Timer'}`,
          message: `I'll notify you when your ${timerData.label || 'timer'} is complete.`,
          type: "info",
          persistent: false
        });
        console.log('✅ Timer setup notification shown');
      } catch (notificationError) {
        console.error('❌ Failed to show timer setup notification:', notificationError);
      }
      
      if (timerData.milliseconds && timerData.milliseconds > 0) {
        const timerId = `timer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const expirationTime = Date.now() + timerData.milliseconds;
        
        console.log(`⏰ Setting client-side timer for ${timerData.milliseconds}ms (${timerData.label}) to expire at ${new Date(expirationTime).toLocaleTimeString()}`);
        
        const timeoutId = setTimeout(async () => {
          if (!isMountedRef.current) {
            console.log('Timer completed but component unmounted, skipping notification');
            return;
          }
          
          console.log(`⏰ Timer complete: ${timerData.label}`);
          
          try {
            const soundPlayed = await playNotificationSound();
            console.log('🔊 Timer complete notification sound played:', soundPlayed);
          } catch (soundError) {
            console.error('❌ Could not play timer completion sound:', soundError);
          }
          
          try {
            await showNotification({
              title: "Timer Complete",
              message: `Your ${timerData.label} timer is complete!`,
              type: "info",
              persistent: true
            });
            console.log('✅ Timer completion notification shown');
          } catch (notificationError) {
            console.error('❌ Failed to show timer completion notification:', notificationError);
          }
          
          if (isMountedRef.current) {
            activeTimersRef.current.delete(timerId);
            
            debouncedRefresh(['notifications'], 500);
            debouncedRefresh(['timers'], 700);
          }
        }, timerData.milliseconds);
        
        activeTimersRef.current.set(timerId, { 
          id: timerId,
          timeoutId, 
          label: timerData.label,
          expiresAt: expirationTime 
        });
      }
    } 
    else if (timerData.action === 'cancelled') {
      try {
        await playNotificationSound();
        console.log('🔊 Timer cancellation sound played');
      } catch (soundError) {
        console.error('❌ Could not play timer cancellation sound:', soundError);
      }
      
      try {
        await showNotification({
          title: 'Timer Cancelled',
          message: timerData.message || `Your timer has been cancelled.`,
          type: "info",
          persistent: false
        });
      } catch (notificationError) {
        console.error('❌ Failed to show timer cancellation notification:', notificationError);
      }
    }
    
    if (isMountedRef.current) {
      debouncedRefresh(['timers'], 1000);
    }
  }, [showNotification, debouncedRefresh, isMountedRef]);

  return {
    handleTimerResponse,
    timerPhrasesDetectedRef
  };
}
