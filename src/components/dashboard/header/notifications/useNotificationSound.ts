
/**
 * Hook for playing notification sounds with iOS PWA compatibility
 */
import { playNotificationSound } from "@/utils/notifications/audio";

export function useNotificationSound() {
  const playSound = async () => {
    try {
      console.log('Playing notification sound via hook...');
      await playNotificationSound();
    } catch (error) {
      console.warn('❌ Could not play notification sound:', error);
    }
  };

  return { playNotificationSound: playSound };
}
