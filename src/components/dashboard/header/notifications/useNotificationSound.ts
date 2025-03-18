
/**
 * Hook for playing notification sounds with iOS PWA compatibility
 */
import { playNotificationSound } from "@/utils/notifications/soundUtils";

export function useNotificationSound() {
  const playSound = async () => {
    try {
      console.log('Playing notification sound via hook...');
      await playNotificationSound();
      return true;
    } catch (error) {
      console.warn('❌ Could not play notification sound:', error);
      return false;
    }
  };

  return { playNotificationSound: playSound };
}
