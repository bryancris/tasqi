
export async function playNotificationSound() {
  console.log('🎵 Initializing notification sound...');
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 1.0; // Maximum volume
    
    // Attempt to load the audio before playing
    await new Promise((resolve, reject) => {
      audio.oncanplaythrough = resolve;
      audio.onerror = reject;
      
      // Set a timeout in case loading hangs
      const timeout = setTimeout(() => {
        reject(new Error('Audio loading timed out'));
      }, 3000);
      
      // Cleanup timeout if loaded successfully
      audio.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      // Force load
      audio.load();
    });
    
    console.log('🔊 Attempting to play notification sound...');
    const playPromise = audio.play();
    
    await playPromise;
    
    console.log('✅ Notification sound played successfully');
    
    // Add event listeners for debugging
    audio.addEventListener('playing', () => {
      console.log('🎵 Audio is now playing');
    });
    
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio playback completed');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Audio playback error:', e);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Could not play notification sound:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Try a fallback approach without async/await
    try {
      console.log('🔄 Trying fallback sound approach...');
      const fallbackAudio = new Audio('/notification-sound.mp3');
      fallbackAudio.volume = 1.0;
      
      // Play without awaiting
      fallbackAudio.play();
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback sound also failed:', fallbackError);
      throw error; // Re-throw the original error
    }
  }
}
