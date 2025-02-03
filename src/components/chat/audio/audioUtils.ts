export const SILENCE_THRESHOLD = 5;
export const FFT_SIZE = 256;
export const SILENCE_TIMEOUT = 2000; // 2 seconds

export const getAudioMimeType = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return {
    mimeType: isIOS ? 'audio/mp4' : 'audio/webm',
    codecType: isIOS ? 'audio/mp4' : 'audio/webm;codecs=opus'
  };
};

export const createAudioAnalyser = (stream: MediaStream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  source.connect(analyser);
  return { analyser, audioContext };
};

export const getAverageVolume = (analyser: AnalyserNode) => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);
  return dataArray.reduce((a, b) => a + b) / dataArray.length;
};