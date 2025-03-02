
export async function playNotificationSound() {
  console.log('🎵 Playing notification sound with improved reliability...');
  
  // Use multiple approaches to maximize chances of sound playing
  const playPromises = [];
  
  try {
    // Approach 1: HTMLAudioElement with preload
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 1.0;
    
    // Force preload
    audio.preload = 'auto';
    
    // Add detailed event logging for debugging
    audio.addEventListener('canplaythrough', () => console.log('✅ Audio can play through'));
    audio.addEventListener('playing', () => console.log('✅ Audio is now playing'));
    audio.addEventListener('ended', () => console.log('✅ Audio playback completed'));
    audio.addEventListener('error', (e) => console.error('❌ Audio error:', e));
    
    audio.load(); // Explicitly call load
    
    // Try to play (don't await yet)
    playPromises.push(audio.play().catch(e => {
      console.error('❌ First audio approach failed:', e);
      return false;
    }));
    
    // Approach 2: AudioContext (Web Audio API) - works better in some browsers
    if (window.AudioContext || (window as any).webkitAudioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Fetch the audio file
      const response = await fetch('/notification-sound.mp3')
        .catch(e => {
          console.error('❌ Failed to fetch audio file:', e);
          return null;
        });
      
      if (response) {
        const arrayBuffer = await response.arrayBuffer()
          .catch(e => {
            console.error('❌ Failed to get array buffer:', e);
            return null;
          });
        
        if (arrayBuffer) {
          try {
            // Decode and play
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            console.log('✅ Web Audio API playback started');
            playPromises.push(Promise.resolve(true));
          } catch (decodeError) {
            console.error('❌ Failed to decode audio:', decodeError);
          }
        }
      }
    }
    
    // Approach 3: Last resort approach - simplest method
    const backupAudio = new Audio('/notification-sound.mp3');
    playPromises.push(
      new Promise(resolve => {
        backupAudio.oncanplaythrough = () => {
          backupAudio.play()
            .then(() => {
              console.log('✅ Backup audio playing');
              resolve(true);
            })
            .catch(e => {
              console.error('❌ Backup audio failed:', e);
              resolve(false);
            });
        };
        backupAudio.onerror = () => {
          console.error('❌ Backup audio loading error');
          resolve(false);
        };
        // Set a timeout in case oncanplaythrough never fires
        setTimeout(() => {
          try {
            backupAudio.play().catch(() => {});
            resolve(true);
          } catch {
            resolve(false);
          }
        }, 1000);
        backupAudio.load();
      })
    );
    
    // Wait for any of the approaches to succeed
    const results = await Promise.allSettled(playPromises);
    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value === true);
    
    console.log('🔊 Sound playback attempts completed, success:', anySuccess);
    return anySuccess;
  } catch (error) {
    console.error('❌ Sound playback error:', error);
    
    // Final fallback approach - direct play without fancy handling
    try {
      const fallbackAudio = new Audio('/notification-sound.mp3');
      fallbackAudio.volume = 1.0;
      fallbackAudio.play();
      console.log('⚠️ Using emergency fallback sound playback');
      return true;
    } catch (fallbackError) {
      console.error('❌ All sound playback methods failed:', fallbackError);
      return false;
    }
  }
}
