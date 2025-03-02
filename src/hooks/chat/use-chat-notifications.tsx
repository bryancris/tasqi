
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";

export function useChatNotifications() {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  const handleTimerResponse = async (timerData: any) => {
    if (!timerData) return;
    
    console.log('📅 Processing timer response:', timerData);
    
    // Play notification sound immediately for timer confirmation
    try {
      const audio = new Audio('/notification-sound.mp3');
      await audio.play().catch(e => console.error('Sound play error:', e));
      console.log('🔊 Timer notification sound played');
    } catch (soundError) {
      console.warn('Could not play sound:', soundError);
    }
    
    // Enhanced timer notification
    showNotification({
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
    
    // Invalidate any relevant queries
    await queryClient.invalidateQueries({ queryKey: ['timers'] });
  };

  const handleTimerRelatedResponse = async (response: string) => {
    if (!response) return;
    
    console.log('🔍 Checking for timer references in response:', response);
    
    if (
      response.toLowerCase().includes("set a timer") || 
      response.toLowerCase().includes("notify you at") ||
      response.toLowerCase().includes("timer for") ||
      response.toLowerCase().includes("timer is complete") ||
      response.toLowerCase().includes("minute timer") ||
      response.toLowerCase().includes("second timer")
    ) {
      console.log('⏰ Timer-related phrase detected in response');
      
      // Play notification sound for timer-related responses
      try {
        const audio = new Audio('/notification-sound.mp3');
        await audio.play().catch(e => console.error('Sound play error:', e));
        console.log('🔊 Timer notification sound played for phrase detection');
      } catch (soundError) {
        console.warn('Could not play sound:', soundError);
      }
      
      showNotification({
        title: "Timer Update",
        message: response,
        type: "info",
        persistent: true
      });
    }
  };

  const refreshLists = async () => {
    // Refresh the tasks list and notifications
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    handleTimerResponse,
    handleTimerRelatedResponse,
    refreshLists
  };
}
