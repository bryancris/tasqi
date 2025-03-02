
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";
import { playNotificationSound } from "@/utils/notifications/soundUtils";
import { useRef, useEffect } from "react";

export function useChatNotifications() {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  const activeTimersRef = useRef<Map<string, { timeoutId: NodeJS.Timeout, label: string }>>(new Map());
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      // Clear all active timers
      activeTimersRef.current.forEach(timer => {
        clearTimeout(timer.timeoutId);
      });
      activeTimersRef.current.clear();
    };
  }, []);

  const handleTimerResponse = async (timerData: any) => {
    if (!timerData) {
      console.log('⚠️ Timer data is empty or undefined');
      return;
    }
    
    console.log('📅 Processing timer response:', timerData);
    
    // Handle different timer actions
    if (timerData.action === 'created') {
      // For new timers, show a confirmation notification (no sound)
      try {
        await showNotification({
          title: `Timer Set: ${timerData.label || 'Unnamed Timer'}`,
          message: `I'll notify you when your ${timerData.label || 'timer'} is complete.`,
          type: "info",
          persistent: false // Use non-persistent for setup notifications
        });
        console.log('✅ Timer setup notification shown');
      } catch (notificationError) {
        console.error('❌ Failed to show timer setup notification:', notificationError);
      }
      
      // Set up the actual timer if milliseconds are provided
      if (timerData.milliseconds && timerData.milliseconds > 0) {
        const timerId = Math.random().toString(36).substr(2, 9);
        
        console.log(`⏰ Setting client-side timer for ${timerData.milliseconds}ms (${timerData.label})`);
        
        // Create the timeout to fire when the timer completes
        const timeoutId = setTimeout(async () => {
          console.log(`⏰ Timer complete: ${timerData.label}`);
          
          // Play notification sound for timer completion
          try {
            const soundPlayed = await playNotificationSound();
            console.log('🔊 Timer complete notification sound played:', soundPlayed);
          } catch (soundError) {
            console.error('❌ Could not play timer completion sound:', soundError);
          }
          
          // Show completion notification
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
          
          // Remove this timer from active timers
          activeTimersRef.current.delete(timerId);
          
          // Refresh notifications
          await queryClient.invalidateQueries({ queryKey: ['notifications'] });
          await queryClient.invalidateQueries({ queryKey: ['timers'] });
          
        }, timerData.milliseconds);
        
        // Store the timer reference for cleanup
        activeTimersRef.current.set(timerId, { 
          timeoutId, 
          label: timerData.label 
        });
      }
    } 
    else if (timerData.action === 'cancelled') {
      // Play notification sound for cancellations
      try {
        const soundPlayed = await playNotificationSound();
        console.log('🔊 Timer cancellation sound played:', soundPlayed);
      } catch (soundError) {
        console.error('❌ Could not play timer cancellation sound:', soundError);
      }
      
      // Show cancellation notification
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
    
    // Invalidate queries in a controlled manner with slight delay to prevent UI freezing
    setTimeout(async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ['timers'] });
        console.log('🔄 Timer queries invalidated');
      } catch (queryError) {
        console.error('❌ Failed to invalidate timer queries:', queryError);
      }
    }, 500);
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
      'I\'ll notify you',
      'I\'ve set a', // More generic pattern
      'set a', // More generic pattern
      'timer' // Fallback pattern
    ];
    
    // Check if any of the timer phrases are in the response
    const hasTimerPhrase = timerPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (hasTimerPhrase) {
      console.log('⏰ Timer-related phrase detected in response:', response);
      
      // For phrases, we'll show a notification but WITHOUT sound to avoid confusion
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
    
    // Use a debounced approach to prevent UI freezing
    setTimeout(async () => {
      try {
        // Refresh the tasks list and notifications in sequence, not parallel
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        console.log('✅ Tasks list refreshed');
        
        // Small delay before next invalidation
        setTimeout(async () => {
          await queryClient.invalidateQueries({ queryKey: ['notifications'] });
          console.log('✅ Notifications list refreshed');
          
          // Small delay before final invalidation
          setTimeout(async () => {
            await queryClient.invalidateQueries({ queryKey: ['timers'] });
            console.log('✅ Timers list refreshed');
          }, 200);
        }, 200);
      } catch (refreshError) {
        console.error('❌ Failed to refresh lists:', refreshError);
      }
    }, 300);
  };

  return {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  };
}
