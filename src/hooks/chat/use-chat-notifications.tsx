
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { playNotificationSound } from "@/utils/notifications/soundUtils";

export function useChatNotifications() {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  const handleTimerResponse = async (timerData: any) => {
    if (!timerData) {
      console.log('⚠️ Timer data is empty or undefined');
      return;
    }
    
    console.log('📅 Processing timer response:', timerData);
    
    // Play notification sound immediately for timer confirmation
    try {
      const soundPlayed = await playNotificationSound();
      console.log('🔊 Timer notification sound played successfully:', soundPlayed);
    } catch (soundError) {
      console.error('❌ Could not play timer sound:', soundError);
      // Continue with notification even if sound fails
    }
    
    // Enhanced timer notification
    try {
      await showNotification({
        title: timerData.action === 'created' 
          ? `Timer Set: ${timerData.label || 'Unnamed Timer'}` 
          : timerData.action === 'cancelled' 
            ? 'Timer Cancelled' 
            : 'Timer Update',
        message: timerData.message || "Timer notification",
        type: "info",
        persistent: true,
        action: timerData.action === 'created' ? {
          label: "View Timer",
          onClick: () => {
            // Navigate to the timer view or open timer dialog
            window.location.href = '/dashboard';
          }
        } : undefined
      });
      console.log('✅ Timer notification shown successfully');
    } catch (notificationError) {
      console.error('❌ Failed to show timer notification:', notificationError);
    }
    
    // Invalidate any relevant queries
    try {
      await queryClient.invalidateQueries({ queryKey: ['timers'] });
      console.log('🔄 Timer queries invalidated');
    } catch (queryError) {
      console.error('❌ Failed to invalidate timer queries:', queryError);
    }
  };

  const handleTimerRelatedResponse = async (response: string) => {
    if (!response) {
      console.log('⚠️ Response is empty');
      return;
    }
    
    console.log('🔍 Checking for timer references in response:', response);
    
    // Improved timer phrase detection - more comprehensive and case-insensitive
    const timerPhrases = [
      'set a timer', 
      'notify you at',
      'timer for',
      'timer is complete',
      'minute timer',
      'second timer',
      'hour timer',
      'timer set',
      'timer created',
      'timer started',
      'reminder set',
      'notify you',
      'I\'ll remind you',
      'I\'ll let you know',
      'timer has been set',
      'will remind you',
      'remind you at',
      'reminder has been set',
      'I\'ve set a timer',
      'set a timer',
      'I\'ll notify you'
    ];
    
    // Check if any of the timer phrases are in the response
    const hasTimerPhrase = timerPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (hasTimerPhrase) {
      console.log('⏰ Timer-related phrase detected in response:', response);
      
      // Play notification sound for timer-related responses
      try {
        const soundPlayed = await playNotificationSound();
        console.log('🔊 Timer notification sound played for phrase detection:', soundPlayed);
      } catch (soundError) {
        console.error('❌ Could not play timer phrase sound:', soundError);
      }
      
      try {
        await showNotification({
          title: "Timer Update",
          message: response,
          type: "info",
          persistent: true
        });
        console.log('✅ Timer phrase notification shown successfully');
      } catch (notificationError) {
        console.error('❌ Failed to show timer phrase notification:', notificationError);
      }
    } else {
      console.log('ℹ️ No timer phrases detected in response');
    }
  };

  const refreshLists = async () => {
    console.log('🔄 Refreshing task and notification lists');
    try {
      // Refresh the tasks list and notifications
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['timers'] });
      console.log('✅ Lists refreshed successfully');
    } catch (refreshError) {
      console.error('❌ Failed to refresh lists:', refreshError);
    }
  };

  return {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  };
}
