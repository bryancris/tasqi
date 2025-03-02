
import { useNotifications } from "@/components/notifications/NotificationsManager";
import { useQueryClient } from "@tanstack/react-query";

export function useChatNotifications() {
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  const handleTimerResponse = async (timerData: any) => {
    if (!timerData) return;
    
    // Play notification sound immediately for timer confirmation
    try {
      const audio = new Audio('/notification-sound.mp3');
      await audio.play();
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
    
    if (
      response.includes("set a timer") || 
      response.includes("notify you at") ||
      response.includes("timer for") ||
      response.includes("timer is complete")
    ) {
      // Play notification sound for timer-related responses
      try {
        const audio = new Audio('/notification-sound.mp3');
        await audio.play();
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
