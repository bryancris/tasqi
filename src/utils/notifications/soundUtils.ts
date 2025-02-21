
export async function playNotificationSound() {
  try {
    console.log('🔊 Playing notification sound...');
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    await audio.play();
    console.log('✅ Notification sound played successfully');
  } catch (error) {
    console.warn('❌ Could not play notification sound:', error);
  }
}
