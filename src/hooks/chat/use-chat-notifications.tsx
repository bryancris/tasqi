
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

type ActiveTimer = {
  id: string;
  timeoutId: NodeJS.Timeout;
  label: string;
  expiresAt: number;
};

export function useChatNotifications() {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  const activeTimersRef = useRef<Map<string, ActiveTimer>>(new Map());
  const isMountedRef = useRef<boolean>(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerPhrasesDetectedRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      activeTimersRef.current.forEach(timer => {
        clearTimeout(timer.timeoutId);
      });
      activeTimersRef.current.clear();
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  const debouncedRefresh = useCallback((queryKey: string[], delay: number = 500) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        queryClient.invalidateQueries({ queryKey });
        console.log(`✅ ${queryKey[0]} list refreshed`);
      }
      refreshTimeoutRef.current = null;
    }, delay);
  }, [queryClient]);

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
  }, [showNotification, debouncedRefresh]);

  const handleTimerRelatedResponse = useCallback(async (response: string) => {
    if (!response || !isMountedRef.current) {
      console.log('⚠️ Response is empty or component unmounted');
      return;
    }
    
    console.log('🔍 Checking for timer references in response:', response);
    
    const timerPhrases = [
      'timer is complete',
      'timer cancelled',
      'reminder set',
    ];
    
    // Modified to exclude "set a timer" and similar phrases that would cause duplicate notifications
    // We now only notify for non-creation timer phrases
    
    // Check if this is a timer creation confirmation response
    const isTimerCreationResponse = 
      response.toLowerCase().includes('set a timer') || 
      response.toLowerCase().includes('timer for') ||
      response.toLowerCase().includes('timer set') ||
      response.toLowerCase().includes('timer created') ||
      response.toLowerCase().includes('i\'ve set a timer') ||
      response.toLowerCase().includes('minute timer') ||
      response.toLowerCase().includes('second timer') ||
      response.toLowerCase().includes('hour timer');
    
    // Skip timer creation responses since they'll be handled by handleTimerResponse
    if (isTimerCreationResponse) {
      console.log('⏰ Timer creation phrase detected, skipping duplicate notification');
      return;
    }
    
    // For other timer-related responses that aren't about creating timers
    const hasOtherTimerPhrase = timerPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (hasOtherTimerPhrase) {
      console.log('⏰ Non-creation timer phrase detected in response:', response);
      
      try {
        await showNotification({
          title: "Timer Update",
          message: response,
          type: "info",
          persistent: false
        });
        console.log('✅ Timer update notification shown successfully');
      } catch (notificationError) {
        console.error('❌ Failed to show timer update notification:', notificationError);
      }
    } else {
      console.log('ℹ️ No relevant timer phrases detected in response');
    }
  }, [showNotification]);

  const refreshLists = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    console.log('🔄 Refreshing task and notification lists');
    
    debouncedRefresh(['tasks'], 500);
    debouncedRefresh(['notifications'], 800);
    debouncedRefresh(['timers'], 1000);
  }, [debouncedRefresh]);

  return {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  };
}
