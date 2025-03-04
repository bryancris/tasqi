
/**
 * Utilities for detecting and handling audio format compatibility
 */

/**
 * Get the best supported audio MIME type for the current browser
 */
export function getAudioMimeType(): { mimeType: string, codecType: string } {
  const audioElement = document.createElement('audio');
  
  // Check for various audio format support
  const formats = [
    { mimeType: 'audio/mp3', codecType: 'audio/mpeg' },
    { mimeType: 'audio/wav', codecType: 'audio/wav' },
    { mimeType: 'audio/ogg', codecType: 'audio/ogg; codecs=vorbis' },
    { mimeType: 'audio/aac', codecType: 'audio/aac' },
  ];
  
  // Find first supported format
  for (const format of formats) {
    if (audioElement.canPlayType(format.codecType) !== '') {
      return format;
    }
  }
  
  // Default to MP3 if no format is definitively supported
  return formats[0];
}

/**
 * Create an audio context and analyzer for more advanced audio processing
 */
export function createAudioAnalyser(stream: MediaStream): { 
  audioContext: AudioContext;
  analyser: AnalyserNode;
} {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  
  // Configure the analyser for typical voice/notification sounds
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  
  // Connect the stream to the analyser
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  return { audioContext, analyser };
}
