
import { useRef, useCallback } from "react";
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { playNotificationSound } from "@/utils/notifications/soundUtils";

export function useResponseHandling(isMountedRef: React.RefObject<boolean>, timerPhrasesDetectedRef: React.RefObject<Set<string>>) {
  const { showNotification } = useNotifications();
  const isProcessingRef = useRef(false);

  const handleTimerRelatedResponse = useCallback(async (response: string) => {
    if (!response || !isMountedRef.current) {
      console.log('⚠️ Response is empty or component unmounted');
      return;
    }
    
    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.log('⚠️ Already processing a response, skipping duplicate');
      return;
    }
    
    // Set processing flag
    isProcessingRef.current = true;
    
    try {
      console.log('🔍 Checking for timer references in response:', response);
      
      const timerPhrases = [
        'timer is complete',
        'timer cancelled',
        'reminder set',
      ];
      
      // Modified to exclude "set a timer" and similar phrases that would cause duplicate notifications
      
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
      
      if (hasOtherTimerPhrase && !isTimerCreationResponse) {
        console.log('⏰ Non-creation timer phrase detected in response:', response);
        
        // Add a small delay to avoid UI jank
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          await playNotificationSound().catch(err => {
            console.warn('Could not play notification sound:', err);
          });
          
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
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  }, [showNotification, isMountedRef]);

  return {
    handleTimerRelatedResponse
  };
}
