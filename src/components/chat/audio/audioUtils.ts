
/**
 * Audio utility functions and constants for speech recognition
 */

// Constants for audio processing
export const SILENCE_THRESHOLD = 5; // Volume level below which is considered silence
export const FFT_SIZE = 256; // Size of the Fast Fourier Transform for audio analysis
export const SILENCE_TIMEOUT = 2000; // Time in ms of silence before stopping recording

/**
 * Get the appropriate audio MIME type based on browser/platform
 * @returns Object containing mime type and codec type
 */
export const getAudioMimeType = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return {
    mimeType: isIOS ? 'audio/mp4' : 'audio/webm',
    codecType: isIOS ? 'audio/mp4' : 'audio/webm;codecs=opus'
  };
};

/**
 * Creates an audio analyzer for processing audio input
 * @param stream The media stream from the microphone
 * @returns Object containing analyzer and audio context
 */
export const createAudioAnalyser = (stream: MediaStream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  // Configure the analyzer
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0.8; // Add smoothing to reduce jitter
  
  // Connect the audio source to the analyzer
  source.connect(analyser);
  
  return { analyser, audioContext };
};

/**
 * Calculate the average volume from an audio analyzer
 * @param analyser The audio analyzer node
 * @returns Average volume level
 */
export const getAverageVolume = (analyser: AnalyserNode) => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  
  // Calculate the average of all frequency bins
  const sum = dataArray.reduce((a, b) => a + b, 0);
  return dataArray.length > 0 ? sum / dataArray.length : 0;
};

/**
 * Converts a MediaStream to a Blob for transcription
 * @param stream The media stream to convert
 * @param mimeType The MIME type to use for the recording
 * @returns Promise resolving to the recorded blob
 */
export const streamToBlob = (stream: MediaStream, mimeType: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    
    recorder.onerror = (e) => {
      reject(e);
    };
    
    // Start and immediately stop to get the blob
    recorder.start();
    setTimeout(() => recorder.stop(), 100);
  });
};

/**
 * Convert base64 encoded audio to a Blob
 * @param base64Audio Base64 encoded audio string
 * @param mimeType MIME type of the audio
 * @returns Audio Blob
 */
export const base64ToBlob = (base64Audio: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64Audio);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};
