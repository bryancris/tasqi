
export async function playNotificationSound() {
  console.log('🎵 Initializing notification sound...');
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    
    console.log('🔊 Attempting to play notification sound...');
    await audio.play();
    
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
    
  } catch (error) {
    console.error('❌ Could not play notification sound:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Re-throw to handle in the calling code
  }
}
