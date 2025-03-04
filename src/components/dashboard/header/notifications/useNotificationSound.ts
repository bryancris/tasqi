
/**
 * Hook for playing notification sounds with iOS PWA compatibility
 */
export function useNotificationSound() {
  const playNotificationSound = async () => {
    try {
      console.log('Playing notification sound...');
      
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                  !(window as any).MSStream;
      
      if (isIOS) {
        console.log('🍎 iOS device detected, using iOS-compatible approach');
        
        // iOS requires user interaction to play audio in many contexts
        // Use a simpler Audio element with lower volume to avoid loudness issues on iOS
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3; // Lower volume for iOS
        
        // Create a timeout promise to handle cases where play() hangs
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        // Try to play with timeout protection
        try {
          await Promise.race([audio.play(), timeoutPromise]);
          console.log('✅ iOS notification sound started playing');
        } catch (iosError) {
          // This is expected on iOS without user interaction
          console.warn('⚠️ iOS audio autoplay blocked (normal behavior):', iosError);
          
          // Try fallback approach - load first to prepare audio
          audio.load();
          try {
            await audio.play();
          } catch (secondError) {
            console.warn('⚠️ iOS fallback sound also failed:', secondError);
          }
        }
      } else {
        // Standard approach for non-iOS devices
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        await audio.play();
        console.log('✅ Notification sound played successfully');
      }
    } catch (error) {
      console.warn('❌ Could not play notification sound:', error);
    }
  };

  return { playNotificationSound };
}
