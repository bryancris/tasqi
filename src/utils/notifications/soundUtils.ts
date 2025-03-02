
export async function playNotificationSound() {
  console.log('🎵 Playing notification sound...');
  
  return new Promise<boolean>(async (resolve) => {
    try {
      // Create audio element with better error handling
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7; // Slightly lower volume to avoid startling users
      audio.preload = 'auto';
      
      // Set up event handlers before attempting to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback successful');
            resolve(true);
          })
          .catch(error => {
            console.warn('⚠️ HTML5 Audio playback failed:', error);
            
            // Web Audio API fallback
            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContext) {
                const audioContext = new AudioContext();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
                
                console.log('✅ Web Audio API fallback sound played');
                resolve(true);
              } else {
                console.error('❌ Both HTML5 Audio and Web Audio API unavailable');
                resolve(false);
              }
            } catch (webAudioError) {
              console.error('❌ Web Audio API fallback failed:', webAudioError);
              resolve(false);
            }
          });
      } else {
        console.warn('⚠️ Audio play() returned undefined');
        resolve(false);
      }
      
      // Safety timeout in case all methods fail or hang
      setTimeout(() => {
        console.warn('⚠️ Audio playback timed out');
        resolve(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Fatal error in sound playback:', error);
      resolve(false);
    }
  });
}
