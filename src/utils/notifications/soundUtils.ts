
export async function playNotificationSound() {
  console.log('🎵 Playing notification sound with improved reliability...');
  
  return new Promise<boolean>(async (resolve) => {
    try {
      // Approach 1: Try playing using multiple Audio elements
      const audio1 = new Audio('/notification-sound.mp3');
      const audio2 = new Audio('/notification-sound.mp3');
      const audio3 = new Audio('/notification-sound.mp3');
      
      // Set volume for all audio elements
      [audio1, audio2, audio3].forEach(audio => {
        audio.volume = 1.0;
        audio.preload = 'auto';
      });
      
      // Try to play with each audio element
      const playPromises = [];
      
      // First attempt
      playPromises.push(
        audio1.play()
          .then(() => {
            console.log('✅ First audio playback successful');
            return true;
          })
          .catch(error => {
            console.warn('⚠️ First audio playback failed:', error);
            return false;
          })
      );
      
      // Second attempt with timeout
      setTimeout(() => {
        playPromises.push(
          audio2.play()
            .then(() => {
              console.log('✅ Second audio playback successful');
              return true;
            })
            .catch(error => {
              console.warn('⚠️ Second audio playback failed:', error);
              return false;
            })
        );
      }, 100);
      
      // Third attempt with different timeout
      setTimeout(() => {
        playPromises.push(
          audio3.play()
            .then(() => {
              console.log('✅ Third audio playback successful');
              return true;
            })
            .catch(error => {
              console.warn('⚠️ Third audio playback failed:', error);
              return false;
            })
        );
      }, 200);
      
      // Approach 2: Web Audio API fallback
      setTimeout(async () => {
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
            playPromises.push(Promise.resolve(true));
          }
        } catch (webAudioError) {
          console.warn('⚠️ Web Audio API fallback failed:', webAudioError);
        }
      }, 300);
      
      // Final resolver - wait for some attempts to complete
      setTimeout(async () => {
        try {
          const results = await Promise.allSettled(playPromises);
          const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
          
          console.log('🔊 Sound playback attempts completed, success:', anySuccess);
          resolve(anySuccess);
        } catch (error) {
          console.error('❌ Error waiting for playback results:', error);
          resolve(false);
        }
      }, 500);
    } catch (error) {
      console.error('❌ Fatal error in sound playback:', error);
      resolve(false);
    }
  });
}
